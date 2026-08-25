import { Container, Eyebrow } from "@/components/ui";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";

export const dynamic = "force-dynamic";
export default async function RevisionsPage() {
  const client = await requireClient();
  const db = await readDb();
  const count = db.revisions.filter((r) => r.client_id === client.id).length;
  return <section className="pt-36 pb-20"><Container><form action="/api/portal/revisions" method="post" className="mx-auto max-w-2xl card p-8"><Eyebrow>Request changes</Eyebrow><h1 className="mt-5 font-display text-3xl font-semibold text-fg">One revision round is included.</h1>{count > 0 && <p className="mt-3 text-sm text-accent-soft">You have already submitted {count} request. Additional changes may be quoted separately.</p>}<textarea name="notes" required rows={8} className="mt-6 w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" placeholder="Tell us what should change. Mention the section if you can." /><button className="mt-5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Submit request</button></form></Container></section>;
}
