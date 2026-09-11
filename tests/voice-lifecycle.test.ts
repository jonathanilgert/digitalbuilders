import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimVoiceTestCall, completeVoiceCancellation, createPaidVoiceAgent, finalizeVoiceApproval, finishVoiceTestCall, markVoiceGoLiveBindingFailed, markVoiceProviderCleanup, readDb, recordVoiceCallAndUsage, recordVoiceSubscription, scheduleVoiceCancellation, setVoiceProvisioning } from "../src/lib/portal/store";


let root = "";
beforeEach(async () => { root = await mkdtemp(path.join(os.tmpdir(), "voice-life-")); process.env.PORTAL_DATA_DIR = root; });
afterEach(async () => { delete process.env.PORTAL_DATA_DIR; delete process.env.VOICE_PROVIDER_MUTATIONS_ENABLED; await rm(root, { recursive: true, force: true }); });

async function fixture() {
  const { voiceAgent } = await createPaidVoiceAgent({ source: "direct", plan: "voice_afterhours", billing_interval: "month", amount_paid: 14900, stripe_session_id: "cs_life", stripe_customer_id: "cus_life", stripe_payment_method_id: "pm_life", business_name: "Life Test", contact_name: "Owner", email: "life@example.com", phone: "+140****0123" });
  await setVoiceProvisioning(voiceAgent.id, { provisioned_number: "+140****0999", twilio_number_sid: "PN_life", vapi_assistant_id: "asst_life", vapi_phone_number_id: "vphone_life", provisioning_state: "provisioned" });
  return voiceAgent.id;
}

describe("voice go-live and operations", () => {
  it("attaches one subscription and rejects a different subscription", async () => {
    const id = await fixture();
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 2_592_000_000).toISOString();
    const first = await finalizeVoiceApproval(id, { id: "sub_one", status: "active", period_start: start, period_end: end });
    const retry = await finalizeVoiceApproval(id, { id: "sub_one", status: "active", period_start: start, period_end: end });
    expect(first?.stripe_subscription_id).toBe("sub_one");
    expect(retry?.status).toBe("live");
    await expect(finalizeVoiceApproval(id, { id: "sub_two", status: "active", period_start: start, period_end: end })).rejects.toThrow(/different subscription/);
  });

  it("durably preserves the subscription while phone binding awaits recovery", async () => {
    const id = await fixture();
    const start = "2026-01-10T00:00:00.000Z";
    const end = "2027-01-10T00:00:00.000Z";
    await recordVoiceSubscription(id, { id: "sub_recover", status: "active", period_start: start, period_end: end });
    await markVoiceGoLiveBindingFailed(id, "Vapi unavailable");
    let agent = (await readDb()).voice_agents[0];
    expect(agent.stripe_subscription_id).toBe("sub_recover");
    expect(agent.go_live_state).toBe("binding_failed");
    expect(agent.status).toBe("paid");
    await finalizeVoiceApproval(id, { id: "sub_recover", status: "active", period_start: start, period_end: end });
    agent = (await readDb()).voice_agents[0];
    expect(agent.status).toBe("live");
    expect(agent.go_live_state).toBe("live");
  });

  it("counts a completed call once and records threshold alerts once", async () => {
    const id = await fixture();
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 2_592_000_000).toISOString();
    await finalizeVoiceApproval(id, { id: "sub_usage", status: "active", period_start: start, period_end: end });
    const call = { id: "call_usage", voice_agent_id: id, vapi_call_id: "vapi_usage", direction: "inbound", started_at: start, duration_s: 7_500 };
    const first = await recordVoiceCallAndUsage(call);
    const duplicate = await recordVoiceCallAndUsage(call);
    expect(first.thresholds).toEqual([80]);
    expect(duplicate.created).toBe(false);
    const db = await readDb();
    expect(db.call_records).toHaveLength(1);
    expect(db.voice_agents[0].minutes_used_current_period).toBe(125);
    expect(db.usage_alerts).toHaveLength(1);
  });

  it("sends only the highest newly crossed threshold when one call jumps past both", async () => {
    const id = await fixture();
    const start = new Date().toISOString();
    await finalizeVoiceApproval(id, { id: "sub_jump", status: "active", period_start: start, period_end: new Date(Date.now() + 2_592_000_000).toISOString() });
    const result = await recordVoiceCallAndUsage({ id: "call_jump", voice_agent_id: id, vapi_call_id: "vapi_jump", direction: "inbound", started_at: start, duration_s: 12_000 });
    expect(result.thresholds).toEqual([100]);
    expect((await readDb()).usage_alerts.map((item) => item.threshold)).toEqual([100]);
  });

  it("resets annual-plan included usage monthly without changing annual billing dates", async () => {
    const { voiceAgent } = await createPaidVoiceAgent({ source: "direct", plan: "voice_afterhours", billing_interval: "year", amount_paid: 14900, stripe_session_id: "cs_annual", stripe_customer_id: "cus_annual", stripe_payment_method_id: "pm_annual", business_name: "Annual", contact_name: "Owner", email: "annual@example.com", phone: "+140****0123" });
    await finalizeVoiceApproval(voiceAgent.id, { id: "sub_annual", status: "active", period_start: "2026-01-10T00:00:00.000Z", period_end: "2027-01-10T00:00:00.000Z" });
    await recordVoiceCallAndUsage({ id: "jan", voice_agent_id: voiceAgent.id, vapi_call_id: "jan", direction: "inbound", started_at: "2026-01-20T00:00:00.000Z", duration_s: 600 });
    const result = await recordVoiceCallAndUsage({ id: "feb", voice_agent_id: voiceAgent.id, vapi_call_id: "feb", direction: "inbound", started_at: "2026-02-11T00:00:00.000Z", duration_s: 300 });
    expect(result.agent.minutes_used_current_period).toBe(5);
    expect(result.agent.usage_period_start).toBe("2026-02-10T00:00:00.000Z");
    expect(result.agent.usage_period_end).toBe("2026-03-10T00:00:00.000Z");
    expect(result.agent.period_end).toBe("2027-01-10T00:00:00.000Z");
  });

  it("claims test calls transactionally and enforces cooldown and daily quota", async () => {
    const id = await fixture();
    const at = new Date("2026-04-01T12:00:00.000Z");
    const concurrent = await Promise.all(Array.from({ length: 5 }, () => claimVoiceTestCall({ voice_agent_id: id, idempotency_key: "same-request", destination: "+14035550123", at })));
    expect(concurrent.filter((item) => item.ok)).toHaveLength(1);
    const first = concurrent.find((item) => item.ok)!;
    await finishVoiceTestCall(first.attempt.id, { vapi_call_id: "vapi_test_1" });
    expect((await claimVoiceTestCall({ voice_agent_id: id, idempotency_key: "second-request", destination: "+14035550123", at: new Date(at.getTime() + 60_000) })).reason).toBe("cooldown");
    expect((await claimVoiceTestCall({ voice_agent_id: id, idempotency_key: "second-request", destination: "+14035550123", at: new Date(at.getTime() + 6 * 60_000) })).ok).toBe(true);
    expect((await claimVoiceTestCall({ voice_agent_id: id, idempotency_key: "third-request", destination: "+14035550123", at: new Date(at.getTime() + 12 * 60_000) })).ok).toBe(true);
    expect((await claimVoiceTestCall({ voice_agent_id: id, idempotency_key: "fourth-request", destination: "+14035550123", at: new Date(at.getTime() + 18 * 60_000) })).reason).toBe("quota");
  });


  it("persists cancellation before provider cleanup and keeps a recovery marker", async () => {
    const id = await fixture();
    const start = new Date().toISOString(); const end = new Date(Date.now() + 2_592_000_000).toISOString();
    await finalizeVoiceApproval(id, { id: "sub_cancel", status: "active", period_start: start, period_end: end });
    await scheduleVoiceCancellation(id, end);
    let db = await readDb();
    expect(db.voice_agents[0].status).toBe("cancellation_pending");
    expect(db.voice_agents[0].vapi_phone_number_id).toBe("vphone_life");
    await completeVoiceCancellation("sub_cancel");
    db = await readDb();
    expect(db.voice_agents[0].status).toBe("cancelled");
    expect(db.voice_agents[0].provider_cleanup_status).toBe("pending");
    await markVoiceProviderCleanup(id, { completed: true });
    db = await readDb();
    expect(db.voice_agents[0].provider_cleanup_status).toBe("completed");
    expect(db.voice_agents[0].provider_unbound_at).toBeTruthy();
    expect(db.voice_agents[0].records_retention_status).toBe("retained_for_export_and_support");
    expect(db.clients).toHaveLength(1);
    expect(db.voice_agents).toHaveLength(1);
    expect(db.voice_steps).toHaveLength(6);
  });
});
