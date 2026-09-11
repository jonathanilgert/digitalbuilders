import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { markUsageAlertSent, markVoiceLeadSent, readDb, recordVoiceCallAndUsage, uid } from "@/lib/portal/store";
import { sendNotificationOnce } from "@/lib/portal/notifications";
import { sendMail } from "@/lib/portal/mail";
import { voicePlans } from "@/lib/portal/types";

export const runtime = "nodejs";

function authorized(req: Request) {
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (!expected) return false;
  const supplied = req.headers.get("x-vapi-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function secondsBetween(start: string, end?: string) {
  if (!end) return 0;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length") || 0) > 2_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const body = await req.json().catch(() => null) as null | { message?: Record<string, unknown> };
  const message = body?.message;
  if (!message || message.type !== "end-of-call-report") return NextResponse.json({ ok: true, ignored: true });
  const call = (message.call || {}) as Record<string, unknown>;
  const artifact = (message.artifact || {}) as Record<string, unknown>;
  const callId = String(call.id || "");
  if (!callId) return NextResponse.json({ error: "Call ID missing" }, { status: 400 });
  const db = await readDb();
  const assistantId = String(call.assistantId || "");
  const phoneNumberId = String(call.phoneNumberId || "");
  const agent = db.voice_agents.find((item) => item.vapi_assistant_id === assistantId || item.vapi_phone_number_id === phoneNumberId);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  const startedAt = String(call.startedAt || message.startedAt || new Date().toISOString());
  const endedAt = String(call.endedAt || message.endedAt || "") || undefined;
  const duration = Number(message.durationSeconds || call.durationSeconds || secondsBetween(startedAt, endedAt));
  const result = await recordVoiceCallAndUsage({
    id: uid("call"), voice_agent_id: agent.id, vapi_call_id: callId,
    direction: String(call.type || "inbound"), from_number: String(((call.customer || {}) as Record<string, unknown>).number || "") || undefined,
    started_at: startedAt, ended_at: endedAt, duration_s: Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0,
    cost_usd: Number.isFinite(Number(message.cost)) ? Number(message.cost) : undefined,
    transcript: typeof artifact.transcript === "string" ? artifact.transcript : typeof message.transcript === "string" ? message.transcript : undefined,
    summary: typeof artifact.summary === "string" ? artifact.summary : typeof message.summary === "string" ? message.summary : undefined,
    ended_reason: typeof message.endedReason === "string" ? message.endedReason : undefined,
    recording_url: typeof artifact.recordingUrl === "string" ? artifact.recordingUrl : undefined,
  });
  const owner = db.clients.find((item) => item.id === agent.client_id);
  const leadStep = db.voice_steps.find((item) => item.voice_agent_id === agent.id && item.step_number === 5)?.data || {};
  const emails = (Array.isArray(leadStep.email_to) ? leadStep.email_to : String(leadStep.email_to || "").split(",")).map(String).map((item) => item.trim()).filter((item) => item.includes("@")).slice(0, 3);
  if (owner && result.call.direction !== "outbound-test" && !result.call.lead_sent_at && emails.length) {
    const details = result.call.summary || result.call.transcript || "The caller completed a call with your voice agent. Open the portal for details.";
    const sent = await sendNotificationOnce("vapi-lead", callId, () =>
      sendMail(emails.join(","), `New voice-agent call for ${owner.business_name}`, `Caller: ${result.call.from_number || "Number unavailable"}\nDuration: ${Math.ceil(result.call.duration_s / 60)} minute(s)\nOutcome: ${result.call.outcome || result.call.ended_reason || "Completed"}\n\n${details}\n\nOpen your Digital Builders portal for the complete call record.`),
    );
    if (sent) await markVoiceLeadSent(callId);
  }
  if (owner && result.thresholds.length) {
    const plan = voicePlans[agent.plan];
    const threshold = Math.max(...result.thresholds) as 80 | 100;
    const atCap = threshold === 100;
    const key = `${agent.id}:${result.agent.usage_period_start}:${threshold}`;
    const sent = await sendNotificationOnce("voice-usage", key, () =>
      sendMail(owner.email, `Your voice agent is at ${threshold}% of included minutes`, `Hi ${owner.contact_name || "there"},\n\nYour ${plan.name} voice agent has used ${Math.ceil(result.agent.minutes_used_current_period)} of ${agent.minutes_included} included minutes this period.\n\n${atCap ? "Calls will continue without interruption. We’ll forgive your first overage and contact you before recommending any plan change." : "Nothing changes yet; this is an early heads-up so there are no surprises."}\n\nDigital Builders`),
    );
    if (sent) await markUsageAlertSent(agent.id, result.agent.usage_period_start!, threshold);
  }
  return NextResponse.json({ ok: true, duplicate: !result.created, thresholds: result.thresholds });
}
