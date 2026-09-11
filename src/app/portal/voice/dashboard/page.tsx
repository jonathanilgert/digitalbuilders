import Link from "next/link";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { voicePlans } from "@/lib/portal/types";
import { Container } from "@/components/ui";
import { VoiceLifecycleControls } from "@/components/portal/voice-lifecycle-controls";

const statusLabels: Record<string, string> = {
  paid: "Payment received", in_progress: "Intake in progress", ready_to_build: "Ready to build", building: "Building your test", test_call: "Test call ready", revising: "Revision in progress", live: "Live", cancellation_pending: "Cancellation scheduled", cancelled: "Cancelled",
};

export default async function VoiceDashboardPage() {
  const client = await requireClient();
  const db = await readDb();
  const agent = db.voice_agents.find((item) => item.client_id === client.id);
  if (!agent) return <section className="pt-36 pb-20"><Container><div className="card p-6"><h1>No voice agent found</h1></div></Container></section>;
  const plan = voicePlans[agent.plan];
  const steps = db.voice_steps.filter((item) => item.voice_agent_id === agent.id).sort((a, b) => a.step_number - b.step_number);
  const completed = steps.filter((item) => item.state === "complete").length;
  const calls = db.call_records.filter((item) => item.voice_agent_id === agent.id).sort((a, b) => b.started_at.localeCompare(a.started_at));
  const revisions = db.voice_revisions.filter((item) => item.voice_agent_id === agent.id).sort((a, b) => b.round - a.round);
  const usagePercent = Math.min(100, Math.round((agent.minutes_used_current_period / Math.max(1, agent.minutes_included)) * 100));
  const overCap = agent.minutes_used_current_period >= agent.minutes_included;
  const canEditIntake = !["live", "cancellation_pending", "cancelled"].includes(agent.status);
  const packageKeys = agent.package_manifest ? Object.keys(agent.package_manifest) : [];

  return <section className="pt-36 pb-20"><Container>
    <section className="card p-6 sm:p-8">
      <span className="eyebrow">AI voice agent</span>
      <h1>{statusLabels[agent.status] || agent.status}</h1>
      <p>{plan.name} · {agent.billing_interval === "year" ? "annual" : "monthly"} billing</p>
      {agent.provisioned_number && <p><strong>Agent number:</strong> {agent.provisioned_number}</p>}
      {agent.status === "cancellation_pending" && <p className="notice">Service remains active through {agent.cancellation_effective_at ? new Date(agent.cancellation_effective_at).toLocaleDateString("en-CA") : "the end of the paid period"}. Your data and number are not removed early.</p>}
      {agent.status === "cancelled" && <p className="notice">Service has ended. Your intake and call records are retained for export and support—not automatically deleted—unless a separate deletion request is reviewed and approved.</p>}
      <div className="soft" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>Intake progress</strong><span>{completed}/6</span></div>
        <div aria-label={`${completed} of 6 intake steps complete`} style={{ height: 8, borderRadius: 99, background: "#e8eceb", marginTop: 8, overflow: "hidden" }}><div style={{ width: `${(completed / 6) * 100}%`, height: "100%", background: "#123b35" }} /></div>
        {canEditIntake && <Link className="button" href={`/portal/voice/step/${Math.min(completed + 1, 6)}`}>{completed === 6 ? "Review intake" : "Continue intake"}</Link>}
      </div>
    </section>

    {packageKeys.length > 0 && <section className="card" style={{ marginTop: 18 }}><h2>Your build package</h2><p>Private working files generated from your approved intake.</p><div className="actions">{packageKeys.map((key) => <a key={key} className="button secondary" href={`/api/portal/voice/packages/${agent.id}/${key}`}>{key.replace(/([A-Z])/g, " $1")}</a>)}</div></section>}

    {["live", "cancellation_pending", "cancelled"].includes(agent.status) && <section className="card" style={{ marginTop: 18 }}>
      <span className="eyebrow">Current monthly usage period</span><h2>{Math.ceil(agent.minutes_used_current_period)} of {agent.minutes_included} minutes used</h2>
      <div aria-label={`${usagePercent}% of included minutes used`} style={{ height: 10, borderRadius: 99, background: "#e8eceb", overflow: "hidden" }}><div style={{ width: `${usagePercent}%`, height: "100%", background: overCap ? "#b3542e" : "#123b35" }} /></div>
      <p className="micro">{agent.usage_period_start ? new Date(agent.usage_period_start).toLocaleDateString("en-CA") : "Current period"} – {agent.usage_period_end ? new Date(agent.usage_period_end).toLocaleDateString("en-CA") : "monthly reset"}</p>
      {overCap && <p className="notice">Calls continue without interruption. Your first overage is forgiven; we’ll speak with you before recommending any plan change.</p>}
    </section>}

    <VoiceLifecycleControls status={agent.status} defaultPhone={client.phone} />

    <section className="card" style={{ marginTop: 18 }}><h2>Calls</h2>{calls.length === 0 ? <p>No calls have been recorded yet.</p> : <div style={{ display: "grid", gap: 10 }}>{calls.slice(0, 50).map((call) => <details key={call.id} className="soft"><summary><strong>{new Date(call.started_at).toLocaleString("en-CA")}</strong> · {Math.ceil(call.duration_s / 60)} min · {call.outcome || call.ended_reason || "Completed"}</summary><p>Caller: {call.from_number || "Unavailable"}</p>{call.summary && <p><strong>Summary:</strong> {call.summary}</p>}{call.transcript && <pre style={{ whiteSpace: "pre-wrap", font: "inherit" }}>{call.transcript}</pre>}</details>)}</div>}</section>

    {revisions.length > 0 && <section className="card" style={{ marginTop: 18 }}><h2>Revision history</h2>{revisions.map((revision) => <div key={revision.id} className="soft" style={{ marginTop: 10 }}><strong>Round {revision.round}</strong><p>{revision.notes}</p></div>)}</section>}
  </Container></section>;
}
