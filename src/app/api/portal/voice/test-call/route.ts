import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { claimVoiceTestCall, finishVoiceTestCall, readDb, saveCallRecord, setVoiceStatus, voiceAgentForClient, uid } from "@/lib/portal/store";
import { startVoiceTestCall } from "@/lib/voice/lifecycle";

export function canonicalPhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return "";
}

function intakePhones(steps: Array<{ data: Record<string, unknown> }>) {
  const values: unknown[] = [];
  for (const step of steps) {
    values.push(step.data.existing_number, step.data.fallback_number);
    if (Array.isArray(step.data.sms_to)) values.push(...step.data.sms_to);
  }
  return values.map(canonicalPhone).filter(Boolean);
}

export async function POST(req: Request) {
  const client = await requireClient();
  const agent = await voiceAgentForClient(client.id);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  if (process.env.VOICE_PROVIDER_MUTATIONS_ENABLED !== "true") return NextResponse.json({ error: "Test calls are waiting for a staff readiness check." }, { status: 503 });
  if (!agent.vapi_assistant_id || !agent.vapi_phone_number_id) return NextResponse.json({ error: "Your test agent is still being prepared." }, { status: 409 });
  if (!["building", "test_call", "revising"].includes(agent.status)) return NextResponse.json({ error: "A test call is not available in the current state." }, { status: 409 });
  const body = await req.json().catch(() => ({})) as { destination?: unknown; idempotency_key?: unknown };
  const destination = canonicalPhone(body.destination || client.phone);
  const db = await readDb();
  const allowed = new Set([canonicalPhone(client.phone), ...intakePhones(db.voice_steps.filter((step) => step.voice_agent_id === agent.id))].filter(Boolean));
  if (!destination || !allowed.has(destination)) return NextResponse.json({ error: "Test calls can only be sent to a phone number saved on your account or intake." }, { status: 403 });
  const suppliedKey = String(req.headers.get("idempotency-key") || body.idempotency_key || "");
  const idempotencyKey = /^[A-Za-z0-9_.:-]{8,128}$/.test(suppliedKey) ? suppliedKey : crypto.randomUUID();
  const claim = await claimVoiceTestCall({ voice_agent_id: agent.id, destination, idempotency_key: idempotencyKey });
  if (!claim.ok) {
    const status = claim.reason === "duplicate" && claim.attempt.status === "started" ? 200 : 429;
    return NextResponse.json(claim.reason === "duplicate" && claim.attempt.status === "started"
      ? { ok: true, duplicate: true, call_id: claim.attempt.vapi_call_id }
      : { error: claim.reason === "quota" ? "The daily test-call limit has been reached." : "Please wait before placing another test call." }, { status });
  }
  try {
    const call = await startVoiceTestCall(agent, destination);
    await finishVoiceTestCall(claim.attempt.id, { vapi_call_id: call.id });
    await saveCallRecord({ id: uid("call"), voice_agent_id: agent.id, vapi_call_id: call.id, direction: "outbound-test", to_number: destination, started_at: new Date().toISOString(), duration_s: 0, outcome: call.status || "queued" });
    await setVoiceStatus(agent.id, "test_call");
    return NextResponse.json({ ok: true, call_id: call.id, message: "Your test call is on its way." });
  } catch (error) {
    await finishVoiceTestCall(claim.attempt.id, { error: error instanceof Error ? error.message : "Provider call failed" });
    console.error("Voice test call failed", error);
    return NextResponse.json({ error: "The test call could not be started. For safety, please wait five minutes before retrying." }, { status: 502 });
  }
}
