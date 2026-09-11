import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { addVoiceRevision, voiceAgentForClient } from "@/lib/portal/store";
import { sendMail } from "@/lib/portal/mail";
import { site } from "@/lib/content";

export async function POST(req: Request) {
  const client = await requireClient();
  const agent = await voiceAgentForClient(client.id);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  if (!["test_call", "revising"].includes(agent.status)) return NextResponse.json({ error: "Run a test call before requesting changes." }, { status: 409 });
  const body = await req.json().catch(() => ({})) as { notes?: unknown };
  const notes = String(body.notes || "").trim();
  if (notes.length < 10 || notes.length > 3000) return NextResponse.json({ error: "Describe the requested change in 10 to 3,000 characters." }, { status: 400 });
  const revision = await addVoiceRevision(agent.id, notes);
  await sendMail(process.env.PORTAL_NOTIFY_EMAIL || site.inquiriesEmail, `${client.business_name} requested voice-agent changes`, `${client.business_name} requested revision round ${revision.round}.\n\n${notes}`);
  return NextResponse.json({ ok: true, round: revision.round, message: revision.round >= 2 ? "We received this round. We’ll confirm scope and timing with you before any additional work." : "We received your changes and will prepare another test." });
}
