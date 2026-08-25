import { Container, Eyebrow } from "@/components/ui";
import { readDb } from "@/lib/portal/store";

export const dynamic = "force-dynamic";
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await readDb();
  const client = db.clients.find((c) => c.preview_slug === slug);
  return <section className="pt-36 pb-20"><Container><div className="mx-auto max-w-3xl card p-8 text-center"><Eyebrow>Preview</Eyebrow><h1 className="mt-5 font-display text-4xl font-semibold text-fg">{client?.business_name || "Website preview"}</h1><p className="mt-4 text-fg-muted">This preview URL is reserved before the final domain is connected. Nicholas will publish the actual draft here when the build reaches review.</p>{client && <p className="mt-6 text-sm text-accent-soft">Portal status: {client.status.replaceAll("_", " ")}</p>}</div></Container></section>;
}
