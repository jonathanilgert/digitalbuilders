import { NextResponse } from "next/server";
import { readDb, recordIdempotency, releaseIdempotency } from "@/lib/portal/store";
import { stepMeta } from "@/lib/portal/types";
import { sendMail, portalLink } from "@/lib/portal/mail";

export const dynamic = "force-dynamic";
const nudgeDays = [3, 7, 15];
export async function POST(req: Request) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.PORTAL_CRON_TOKEN || auth !== process.env.PORTAL_CRON_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDb();
  const sent: string[] = [];
  for (const client of db.clients.filter((c) => ["paid", "in_progress"].includes(c.status || ""))) {
    const age = Math.floor((Date.now() - new Date(client.created_at).getTime()) / 864e5);
    if (!nudgeDays.includes(age)) continue;
    const steps = db.steps.filter((s) => s.client_id === client.id);
    const outstanding = stepMeta.filter((m) => steps.find((s) => s.step_number === m.number)?.state !== "complete");
    if (outstanding.length === 0) continue;
    const names = outstanding.map((s) => s.title.toLowerCase()).join(", ");
    const assist = age >= 15 ? "\n\nIf you’d rather do this together, reply and we’ll book a quick call." : "";
    await sendMail(client.email, "Finish your Digital Builders website intake", `Hi ${client.contact_name || "there"},\n\nYou’re ${6 - outstanding.length} of 6 steps done. Just ${names} left. Your build starts when the six steps are complete.\n\nOpen your portal: ${portalLink(client)}${assist}\n\nDigital Builders`);
    sent.push(client.id);
  }
  for (const agent of db.voice_agents) {
    if (!["paid", "in_progress"].includes(agent.status)) continue;
    const owner = db.clients.find((item) => item.id === agent.client_id);
    if (!owner) continue;
    const complete = db.voice_steps.filter((item) => item.voice_agent_id === agent.id && item.state === "complete").length;
    if (complete === 6) continue;
    const days = Math.floor((Date.now() - new Date(agent.created_at).getTime()) / 864e5);
    const trigger = [2, 5, 10].find((day) => days === day);
    if (!trigger) continue;
    const key = `${agent.id}:${trigger}`;
    const claim = await recordIdempotency("voice-intake-nudge", key, agent.id);
    if (!claim.created) continue;
    try {
      await sendMail(owner.email, `A quick nudge: your voice-agent intake is ${complete}/6 complete`, `Hi ${owner.contact_name || "there"},\n\nYour voice-agent intake is saved at ${complete} of 6 steps. You can pick up exactly where you left off:\n\n${portalLink(owner)}\n\nIf you would rather complete it together, reply and we’ll arrange a short call.\n\nDigital Builders`);
      sent.push(agent.id);
    } catch (error) { await releaseIdempotency("voice-intake-nudge", key); throw error; }
  }
  return NextResponse.json({ sent: sent.length, client_ids: sent });
}
