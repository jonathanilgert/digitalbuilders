import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";

export async function GET() {
  const client = await requireClient();
  const db = await readDb();
  const agent = db.voice_agents.find((item) => item.client_id === client.id);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  const payload = {
    exported_at: new Date().toISOString(),
    client: { business_name: client.business_name, contact_name: client.contact_name, email: client.email, phone: client.phone },
    voice_agent: { plan: agent.plan, billing_interval: agent.billing_interval, status: agent.status, provisioned_number: agent.provisioned_number, minutes_included: agent.minutes_included, minutes_used_current_period: agent.minutes_used_current_period, billing_period_start: agent.period_start, billing_period_end: agent.period_end, usage_period_start: agent.usage_period_start, usage_period_end: agent.usage_period_end, live_at: agent.live_at, cancellation_effective_at: agent.cancellation_effective_at },
    intake: db.voice_steps.filter((item) => item.voice_agent_id === agent.id).sort((a, b) => a.step_number - b.step_number),
    calls: db.call_records.filter((item) => item.voice_agent_id === agent.id).sort((a, b) => b.started_at.localeCompare(a.started_at)),
    revisions: db.voice_revisions.filter((item) => item.voice_agent_id === agent.id),
  };
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${client.preview_slug || "voice-agent"}-export.json"`, "Cache-Control": "private, no-store" } });
}
