import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Projects — Digital Builders Portal" };
export default async function PortalProductsPage() {
  const client = await requireClient();
  const db = await readDb();
  const hasWebsite = db.steps.some((step) => step.client_id === client.id);
  const agent = db.voice_agents.find((item) => item.client_id === client.id);
  return <section className="pt-36 pb-20"><Container><Eyebrow>Your Digital Builders projects</Eyebrow><h1 className="mt-5 font-display text-4xl font-semibold text-fg">What would you like to work on?</h1><div className="mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">{hasWebsite && <Link href="/portal/dashboard" className="card card-hover p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">Website</p><h2 className="mt-3 font-display text-2xl font-semibold text-fg">Website intake</h2><p className="mt-2 text-sm text-fg-muted">Open your six website steps, preview, and revision status.</p></Link>}{agent && <Link href="/portal/voice/dashboard" className="card card-hover p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">AI front desk</p><h2 className="mt-3 font-display text-2xl font-semibold text-fg">Voice-agent intake</h2><p className="mt-2 text-sm text-fg-muted">Finish the 12-minute setup and see your sandbox number.</p></Link>}</div></Container></section>;
}
