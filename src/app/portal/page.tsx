import { Container, Eyebrow } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Portal — Digital Builders" };
type PortalSearchParams = { sent?: string; checkout?: string; error?: string };

export default function PortalLoginPage({ searchParams }: { searchParams?: Promise<PortalSearchParams> }) {
  return <PortalLogin searchParams={searchParams} />;
}
async function PortalLogin({ searchParams }: { searchParams?: Promise<PortalSearchParams> }) {
  const sp = await searchParams;
  return (
    <section className="bg-aurora min-h-screen pt-36 pb-20">
      <Container>
        <div className="mx-auto max-w-xl card p-8">
          <Eyebrow>Client Portal</Eyebrow>
          <h1 className="mt-6 font-display text-4xl font-semibold text-fg">Access your client portal.</h1>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">Already purchased? Enter the email you used at checkout and we’ll email your no-password magic link if payment has cleared.</p>
          {sp?.checkout && <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent-soft">Payment complete — we’re creating your portal and emailing your magic link to the checkout email. It can take a minute to arrive.</p>}
          {sp?.sent && <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent-soft">If that email has a paid portal, we’ve emailed a fresh magic link.</p>}
          {sp?.error && <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
          <form action="/api/portal/resend" method="post" className="mt-6 space-y-4">
            <input name="email" type="email" required placeholder="you@company.com" className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" />
            <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Email me my link</button>
          </form>
          <Link href="/portal/start" className="mt-6 block text-sm text-accent-soft underline">Need to buy a website first?</Link>
        </div>
      </Container>
    </section>
  );
}
