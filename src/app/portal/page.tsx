import { Container, Eyebrow } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Portal — Digital Builders" };
export default function PortalLoginPage({ searchParams }: { searchParams?: Promise<{ sent?: string; error?: string }> }) {
  return <PortalLogin searchParams={searchParams} />;
}
async function PortalLogin({ searchParams }: { searchParams?: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <section className="bg-aurora min-h-screen pt-36 pb-20">
      <Container>
        <div className="mx-auto max-w-xl card p-8">
          <Eyebrow>Client Portal</Eyebrow>
          <h1 className="mt-6 font-display text-4xl font-semibold text-fg">Open your magic link.</h1>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">No passwords. Enter the email used at checkout and we’ll resend your portal link if payment has cleared.</p>
          {sp?.sent && <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent-soft">If that email has a paid portal, a fresh magic link has been sent.</p>}
          {sp?.error && <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
          <form action="/api/portal/resend" method="post" className="mt-6 space-y-4">
            <input name="email" type="email" required placeholder="you@company.com" className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" />
            <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Email me my link again</button>
          </form>
          <Link href="/portal/start" className="mt-6 block text-sm text-accent-soft underline">Need to buy a website first?</Link>
        </div>
      </Container>
    </section>
  );
}
