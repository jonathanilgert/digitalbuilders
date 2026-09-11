/* eslint-disable react-hooks/purity */
import { Container, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { stepMeta, voicePlans, voiceStepMeta, type Client, type ClientStatus, type VoiceAgent, type VoiceAgentStatus } from "@/lib/portal/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Digital Builders" };
const clientStatuses: ClientStatus[] = ["paid", "in_progress", "ready_to_build", "building", "in_review", "revising", "live", "suspended"];
const voiceStatuses: VoiceAgentStatus[] = ["paid", "in_progress", "ready_to_build", "building", "test_call", "revising", "live", "paused", "cancellation_pending", "cancelled"];

type ProjectRow = { key: string; client: Client; agent?: VoiceAgent; kind: string; plan: string; complete: number; total: number; status: string; last: string };

export default async function AdminPage() {
  await requireAdmin();
  const db = await readDb();
  const rows: ProjectRow[] = [
    ...db.clients.filter((client) => db.steps.some((step) => step.client_id === client.id)).map((client) => {
      const steps = db.steps.filter((step) => step.client_id === client.id);
      return { key: `site-${client.id}`, client, agent: undefined, kind: "Website", plan: client.plan || "Unknown", complete: steps.filter((step) => step.state === "complete").length, total: stepMeta.length, status: client.status || "paid", last: steps.map((step) => step.updated_at).sort().at(-1) || client.created_at };
    }),
    ...db.voice_agents.map((agent) => {
      const client = db.clients.find((item) => item.id === agent.client_id)!;
      const steps = db.voice_steps.filter((step) => step.voice_agent_id === agent.id);
      return { key: `voice-${agent.id}`, client, agent, kind: "Voice agent", plan: voicePlans[agent.plan].name, complete: steps.filter((step) => step.state === "complete").length, total: voiceStepMeta.length, status: agent.status, last: steps.map((step) => step.updated_at).sort().at(-1) || agent.created_at };
    }),
  ].sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());
  return <section className="pt-36 pb-20"><Container><Eyebrow>Admin</Eyebrow><h1 className="mt-5 font-display text-4xl font-semibold text-fg">Client portal tracker</h1><div className="mt-8 overflow-x-auto rounded-2xl border border-line"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-surface/70 text-fg"><tr><th className="p-3">Business</th><th>Product</th><th>Plan</th><th>Progress</th><th>Status</th><th>Days</th><th>Last activity</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => { const days = Math.floor((Date.now() - new Date(row.client.created_at).getTime()) / 864e5); return <tr key={row.key} className="border-t border-line text-fg-muted"><td className="p-3"><strong className="text-fg">{row.client.business_name}</strong><br />{row.client.contact_name} · {row.client.email}{row.agent?.provisioned_number && <><br /><span className="text-xs text-accent-soft">{row.agent.provisioned_number}</span></>}</td><td>{row.kind}</td><td>{row.plan}</td><td>{row.complete}/{row.total}</td><td>{row.status}</td><td>{days}</td><td>{new Date(row.last).toLocaleDateString("en-CA")}</td><td className="p-3"><form action="/api/admin/client" method="post" className="flex flex-wrap gap-2"><input type="hidden" name="client_id" value={row.client.id} /><input type="hidden" name="email" value={row.client.email} />{row.agent ? <><input type="hidden" name="voice_agent_id" value={row.agent.id} /><select name="status" defaultValue={row.agent.status} className="rounded-lg border border-line bg-ink px-2 py-1">{voiceStatuses.map((status) => <option key={status}>{status}</option>)}</select><button name="action" value="voice_status" className="rounded-full border border-line px-3 py-1">Set</button>{["ready_to_build", "building"].includes(row.agent.status) && <button name="action" value="voice_provision" className="rounded-full border border-accent-soft px-3 py-1 text-accent-soft">Provision / retry</button>}</> : <><select name="status" defaultValue={row.client.status} className="rounded-lg border border-line bg-ink px-2 py-1">{clientStatuses.map((status) => <option key={status}>{status}</option>)}</select><button name="action" value="status" className="rounded-full border border-line px-3 py-1">Set</button>{row.client.build_package_path && <a className="rounded-full border border-line px-3 py-1" href={`/admin/package/${row.client.id}`}>Package</a>}</>}<button name="action" value="resend" className="rounded-full border border-line px-3 py-1">Resend link</button></form></td></tr>; })}</tbody></table></div></Container></section>;
}
