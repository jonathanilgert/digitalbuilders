import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { finalizeVoiceApproval, markVoiceGoLiveBindingFailed, recordVoiceSubscription, voiceAgentForClient } from "@/lib/portal/store";
import { stripe } from "@/lib/portal/stripe";
import { bindVoicePhone, createVoiceSubscription } from "@/lib/voice/lifecycle";

export async function POST() {
  const client = await requireClient();
  const agent = await voiceAgentForClient(client.id);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  if (agent.status === "live" && agent.stripe_subscription_id) return NextResponse.json({ ok: true, already_live: true });
  if (!["test_call", "revising"].includes(agent.status)) return NextResponse.json({ error: "Approve after reviewing a test call." }, { status: 409 });
  if (process.env.VOICE_AGENT_GO_LIVE_ENABLED !== "true" || process.env.VOICE_PROVIDER_MUTATIONS_ENABLED !== "true") return NextResponse.json({ error: "Go-live is waiting for a staff readiness check." }, { status: 503 });
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  let subscriptionData = agent.stripe_subscription_id && agent.period_start && agent.period_end
    ? { id: agent.stripe_subscription_id, status: agent.stripe_subscription_status || "active", period_start: agent.period_start, period_end: agent.period_end }
    : null;
  try {
    if (!subscriptionData) {
      const result = await createVoiceSubscription(s, agent);
      subscriptionData = { id: result.subscription.id, status: result.subscription.status, period_start: result.periodStart, period_end: result.periodEnd };
      // Persist billing before the independent Vapi mutation. A failed bind is now recoverable.
      await recordVoiceSubscription(agent.id, subscriptionData);
    }
    await bindVoicePhone(agent);
    const live = await finalizeVoiceApproval(agent.id, subscriptionData);
    return NextResponse.json({ ok: true, status: live?.status });
  } catch (error) {
    if (subscriptionData) await markVoiceGoLiveBindingFailed(agent.id, error instanceof Error ? error.message : "Go-live binding failed");
    console.error("Voice go-live failed", error);
    return NextResponse.json({ error: "Billing state was preserved, but go-live needs staff recovery. It is safe to retry and no subscription will be duplicated." }, { status: 502 });
  }
}
