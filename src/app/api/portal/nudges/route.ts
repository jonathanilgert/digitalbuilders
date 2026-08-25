import { NextResponse } from "next/server";
import { readDb } from "@/lib/portal/store";
import { stepMeta } from "@/lib/portal/types";
import { sendMail, portalLink } from "@/lib/portal/mail";

export const dynamic = "force-dynamic";
const nudgeDays = [3, 7, 15];
export async function POST(req: Request) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.PORTAL_CRON_TOKEN || auth !== process.env.PORTAL_CRON_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDb();
  const sent: string[] = [];
  for (const client of db.clients.filter((c) => ["paid", "in_progress"].includes(c.status))) {
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
  return NextResponse.json({ sent: sent.length, client_ids: sent });
}
