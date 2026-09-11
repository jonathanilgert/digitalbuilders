import { mkdtemp, rm, writeFile, mkdir, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  claimVoiceProvisioning,
  createPaidClient,
  createPaidVoiceAgent,
  mutateDb,
  readDb,
  releaseCouponReservation,
  reserveCoupon,
  setVoiceProvisioning,
  websiteClientForEmail,
} from "../src/lib/portal/store";

let root = "";
const voicePurchase = (overrides: Partial<Parameters<typeof createPaidVoiceAgent>[0]> = {}) => ({
  source: "direct" as const,
  plan: "voice_frontdesk" as const,
  billing_interval: "month" as const,
  amount_paid: 49_900,
  stripe_session_id: "cs_voice_1",
  stripe_customer_id: "cus_1",
  stripe_payment_method_id: "pm_1",
  business_name: "Prairie Plumbing",
  contact_name: "Pat",
  email: "pat@example.com",
  phone: "+14035550100",
  ...overrides,
});
const websitePurchase = (overrides: Partial<Parameters<typeof createPaidClient>[0]> = {}) => ({
  source: "direct" as const,
  plan: "3page" as const,
  amount_paid: 99_900,
  stripe_session_id: "cs_site_1",
  business_name: "Prairie Plumbing",
  contact_name: "Pat",
  email: "pat@example.com",
  phone: "+14035550100",
  ...overrides,
});

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "db-voice-store-"));
  process.env.PORTAL_DATA_DIR = root;
});
afterEach(async () => {
  delete process.env.PORTAL_DATA_DIR;
  await rm(root, { recursive: true, force: true });
});

describe("stable ownership", () => {
  it("supports website-only and voice-only clients", async () => {
    await createPaidClient(websitePurchase());
    await createPaidVoiceAgent(voicePurchase({ email: "voice@example.com", stripe_session_id: "cs_voice_only" }));
    const db = await readDb();
    expect(db.clients).toHaveLength(2);
    expect(db.steps).toHaveLength(6);
    expect(db.voice_agents).toHaveLength(1);
    expect(db.voice_steps).toHaveLength(6);
  });

  it("uses one owner for website then voice", async () => {
    const site = await createPaidClient(websitePurchase());
    const { client, voiceAgent } = await createPaidVoiceAgent(voicePurchase());
    const db = await readDb();
    expect(client.id).toBe(site.id);
    expect(voiceAgent.client_id).toBe(site.id);
    expect(db.clients).toHaveLength(1);
    expect(db.steps).toHaveLength(6);
    expect(db.voice_steps).toHaveLength(6);
  });

  it("uses one owner for voice then website", async () => {
    const { client } = await createPaidVoiceAgent(voicePurchase());
    const site = await createPaidClient(websitePurchase());
    const db = await readDb();
    expect(site.id).toBe(client.id);
    expect(db.clients).toHaveLength(1);
    expect(db.steps).toHaveLength(6);
    expect(db.voice_agents[0].setup_stripe_session_id).toBe("cs_voice_1");
  });

  it("detects and rejects a repeat website purchase before fulfillment", async () => {
    const first = await createPaidClient(websitePurchase());
    expect((await websiteClientForEmail(" PAT@example.com "))?.id).toBe(first.id);
    await expect(createPaidClient(websitePurchase({ stripe_session_id: "cs_site_repeat" }))).rejects.toThrow(/already owns a website/);
    expect((await readDb()).steps).toHaveLength(6);
  });

  it("creates one agent for concurrent duplicate setup sessions", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => createPaidVoiceAgent(voicePurchase())));
    const db = await readDb();
    expect(new Set(results.map((result) => result.voiceAgent.id))).toHaveLength(1);
    expect(db.voice_agents).toHaveLength(1);
  });

  it("rejects a second setup session for the same owner", async () => {
    await createPaidVoiceAgent(voicePurchase());
    await expect(createPaidVoiceAgent(voicePurchase({ stripe_session_id: "cs_voice_2" }))).rejects.toThrow(/already owns/);
    expect((await readDb()).voice_agents).toHaveLength(1);
  });
});

describe("transactional reservations and claims", () => {
  it("reserves exactly the first five voice26 spots under concurrency", async () => {
    const attempts = await Promise.all(Array.from({ length: 12 }, (_, index) => reserveCoupon("voice26", "voice", `attempt-${index}`)));
    expect(attempts.filter((item) => item.ok)).toHaveLength(5);
    expect(attempts.filter((item) => !item.ok)).toHaveLength(7);
    const db = await readDb();
    expect(db.coupon_reservations.filter((item) => item.status === "reserved")).toHaveLength(5);
  });

  it("returns the same reservation for a repeated idempotency key", async () => {
    const first = await reserveCoupon("voice26", "voice", "same-key");
    const second = await reserveCoupon("voice26", "voice", "same-key");
    expect(first.ok && second.ok && first.reservation.id).toBe(second.ok ? second.reservation.id : "");
  });

  it("uses a short checkout lease and rate-limits concurrent email/IP abuse", async () => {
    const first = await reserveCoupon("voice26", "voice", "rate-1", { email: "buyer@example.com", ip: "203.0.113.8" });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("fixture reservation failed");
    const leaseMs = new Date(first.reservation.expires_at).getTime() - new Date(first.reservation.reserved_at).getTime();
    expect(leaseMs).toBe(30 * 60_000);
    const attempts = await Promise.all(Array.from({ length: 6 }, (_, index) => reserveCoupon("voice26", "voice", `rate-${index + 2}`, { email: `buyer${index}@example.com`, ip: "203.0.113.8" })));
    expect(attempts.filter((item) => item.ok)).toHaveLength(2);
    expect(attempts.filter((item) => !item.ok && item.message.includes("network"))).toHaveLength(4);
  });

  it("keeps released spots available and fulfills a paid session idempotently", async () => {
    const abandoned = await reserveCoupon("voice26", "voice", "abandoned", { email: "abandoned@example.com", ip: "198.51.100.1" });
    if (!abandoned.ok) throw new Error("fixture reservation failed");
    await releaseCouponReservation(abandoned.reservation.id);
    const paid = await reserveCoupon("voice26", "voice", "paid", { email: "paid@example.com", ip: "198.51.100.2" });
    if (!paid.ok) throw new Error("fixture reservation failed");
    const purchase = voicePurchase({ coupon_code: "voice26", coupon_reservation_id: paid.reservation.id });
    const first = await createPaidVoiceAgent(purchase);
    const duplicate = await createPaidVoiceAgent(purchase);
    const db = await readDb();
    expect(first.voiceAgent.id).toBe(duplicate.voiceAgent.id);
    expect(db.coupons.find((item) => item.code === "voice26")?.uses).toBe(1);
    expect(db.coupon_reservations.find((item) => item.id === abandoned.reservation.id)?.status).toBe("released");
    expect(db.coupon_reservations.find((item) => item.id === paid.reservation.id)?.status).toBe("redeemed");
  });

  it("recovers an expired provisioning lease and rejects stale lease writes", async () => {
    const { voiceAgent } = await createPaidVoiceAgent(voicePurchase());
    const first = await claimVoiceProvisioning(voiceAgent.id, 1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await claimVoiceProvisioning(voiceAgent.id, 60_000);
    expect(first.claimed).toBe(true);
    expect(second.claimed).toBe(true);
    expect(second.leaseToken).not.toBe(first.leaseToken);
    const stale = await setVoiceProvisioning(voiceAgent.id, { lease_token: first.leaseToken || "", twilio_number_sid: "PN_STALE" });
    expect(stale).toBeNull();
    const current = await setVoiceProvisioning(voiceAgent.id, { lease_token: second.leaseToken || "", twilio_number_sid: "PN_CURRENT", provisioned_number: "+15875550199", provisioning_state: "provisioned" });
    expect(current?.twilio_number_sid).toBe("PN_CURRENT");
  });

  it("renews an active provisioning lease at durable checkpoints", async () => {
    const { voiceAgent } = await createPaidVoiceAgent(voicePurchase());
    const claim = await claimVoiceProvisioning(voiceAgent.id, 1_000);
    const before = new Date(claim.agent?.provisioning_lease_expires_at || 0).getTime();
    const renewed = await setVoiceProvisioning(voiceAgent.id, {
      lease_token: claim.leaseToken || "",
      renew_lease_ms: 60_000,
      twilio_number_sid: "PN_CHECKPOINT",
    });
    expect(renewed?.twilio_number_sid).toBe("PN_CHECKPOINT");
    expect(new Date(renewed?.provisioning_lease_expires_at || 0).getTime()).toBeGreaterThan(before);
  });

  it("rolls back duplicate external provider identifiers", async () => {
    const a = await createPaidVoiceAgent(voicePurchase());
    const b = await createPaidVoiceAgent(voicePurchase({ email: "other@example.com", stripe_session_id: "cs_voice_other" }));
    await expect(mutateDb((db) => {
      db.voice_agents.find((item) => item.id === a.voiceAgent.id)!.twilio_number_sid = "PN_DUP";
      db.voice_agents.find((item) => item.id === b.voiceAgent.id)!.twilio_number_sid = "PN_DUP";
    })).rejects.toThrow();
    expect((await readDb()).voice_agents.every((item) => !item.twilio_number_sid)).toBe(true);
  });
});

describe("legacy import", () => {
  it("imports portal.json once and persists future writes in SQLite", async () => {
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, "portal.json"), JSON.stringify({
      clients: [{ ...websitePurchase(), id: "legacy-client", magic_token: "magic", token_expires_at: "2999-01-01T00:00:00.000Z", status: "paid", preview_slug: "prairie", created_at: "2026-01-01T00:00:00.000Z" }],
      steps: [], assets: [], revisions: [], coupons: [],
    }));
    expect((await readDb()).clients[0].id).toBe("legacy-client");
    await access(path.join(root, "portal.sqlite3"));
    await writeFile(path.join(root, "portal.json"), JSON.stringify({ clients: [] }));
    expect((await readDb()).clients[0].id).toBe("legacy-client");
  });
});
