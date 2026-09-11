import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runVoiceProvisioning } from "@/lib/voice/provision-service";

function authorized(req: Request) {
  const expected = process.env.PORTAL_CRON_TOKEN || "";
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requested = await req.json().catch(() => ({})) as { agent_id?: unknown };
  try {
    const results = await runVoiceProvisioning(typeof requested.agent_id === "string" ? requested.agent_id : undefined);
    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Provisioning failed" }, { status: 503 });
  }
}
