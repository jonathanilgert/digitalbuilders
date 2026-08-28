import Link from "next/link";
import { Container, Eyebrow, Button } from "@/components/ui";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { stepMeta } from "@/lib/portal/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Digital Builders Portal" };
export default async function DashboardPage() {
  const client = await requireClient();
  const db = await readDb();
  const steps = db.steps.filter((s) => s.client_id === client.id);
  const done = steps.filter((s) => s.state === "complete").length;
  const revisions = db.revisions.filter((r) => r.client_id === client.id);
  const submitted = done === 6 || client.status === "ready_to_build";
  return (
    <section className="pt-36 pb-20">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Let’s build your website</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold text-fg">No technical knowledge needed.</h1>
            <p className="mt-3 max-w-2xl text-fg-muted">You answer the questions, we build the site. Six steps, about 30 minutes total. Do them in any order, save as you go, come back any time.</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface/60 px-5 py-4 text-sm text-fg-muted"><strong className="text-fg">{done} of 6</strong> complete<br />Status: {client.status.replaceAll("_", " ")}</div>
        </div>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent" style={{ width: `${(done / 6) * 100}%` }} /></div>
        {submitted && <div className="card mt-10 border-accent/40 bg-accent/10 p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">Submitted</p><h2 className="mt-3 font-display text-2xl font-semibold text-fg">Your details have been submitted.</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">Digital Builders will begin building your website from the information below and touch base once it is ready to preview. You can still reopen a step if you notice something that needs updating.</p><div className="mt-5"><Button href="/portal/submitted" variant="secondary">View next steps</Button></div></div>}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stepMeta.map((m) => {
            const step = steps.find((s) => s.step_number === m.number);
            const label = step?.state === "complete" ? "✓ Complete" : step?.state === "draft" ? "In progress" : "Not started";
            return <Link key={m.number} href={`/portal/step/${m.number}`} className="card card-hover p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">Step {m.number} · {m.time}</p><h2 className="mt-3 font-display text-xl font-semibold text-fg">{m.title}</h2><p className="mt-5 inline-flex rounded-full border border-line px-3 py-1 text-xs text-fg-muted">{label}</p></Link>;
          })}
        </div>
        {client.status === "in_review" && <div className="card mt-10 p-6"><h2 className="font-display text-xl font-semibold text-fg">Your website is ready to look at.</h2><p className="mt-2 text-sm text-fg-muted">Preview: <a className="text-accent-soft underline" href={`/preview/${client.preview_slug}`}>digitalbuilders.ca/preview/{client.preview_slug}</a>. One round of tweaks is included.</p><div className="mt-5 flex flex-wrap gap-3"><Button href="/api/portal/approve" variant="primary">Approve & go live</Button><Button href="/portal/revisions" variant="secondary">Request changes</Button></div></div>}
        {revisions.length > 0 && <p className="mt-6 text-sm text-fg-muted">Revision requests submitted: {revisions.length}. A second request may be quoted separately.</p>}
      </Container>
    </section>
  );
}
