import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { scheduleVoiceCancellation, voiceAgentForClient } from "@/lib/portal/store";
import { stripe } from "@/lib/portal/stripe";

export async function POST() {
  const client = await requireClient();
  const agent = await voiceAgentForClient(client.id);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  if (agent.status === "cancelled") return NextResponse.json({ ok: true, already_cancelled: true });
  if (agent.status === "cancellation_pending") return NextResponse.json({ ok: true, effective_at: agent.cancellation_effective_at });
  if (!agent.stripe_subscription_id) return NextResponse.json({ error: "There is no active voice subscription to cancel." }, { status: 409 });
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  try {
    const subscription = await s.subscriptions.update(agent.stripe_subscription_id, { cancel_at_period_end: true }, { idempotencyKey: `voice-cancel-${agent.id}` });
    const item = subscription.items.data[0];
    const effective = new Date((item?.current_period_end || Math.floor(Date.now() / 1000)) * 1000).toISOString();
    await scheduleVoiceCancellation(agent.id, effective);
    return NextResponse.json({ ok: true, effective_at: effective, message: "Cancellation is scheduled for the end of your paid period. Your number and data remain available until then; contact us if you want to discuss porting the number." });
  } catch (error) {
    console.error("Voice cancellation failed", error);
    return NextResponse.json({ error: "Cancellation could not be scheduled. Please retry or contact us." }, { status: 502 });
  }
}
