import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { stepMeta } from "@/lib/portal/types";
import { CheckoutForm } from "@/components/portal/checkout-form";

export const metadata = { title: "Start a Website — Digital Builders", description: "Pay securely, then complete the no-password Digital Builders client portal." };

export default function PortalStartPage() {
  return (
    <>
      <section className="bg-aurora pt-36 pb-16 sm:pt-44 sm:pb-20">
        <Container>
          <Eyebrow>Step 0 — Pay, then portal</Eyebrow>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-tight text-fg sm:text-6xl">Buy your website, then finish the six-step intake at your pace.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">No technical knowledge needed. You answer the questions, we build the site. Portal access is created only after Stripe confirms payment.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm text-fg-muted">
            <span className="rounded-full border border-line px-4 py-2">No passwords — magic link only</span>
            <span className="rounded-full border border-line px-4 py-2">Six steps · about 30 minutes</span>
            <span className="rounded-full border border-line px-4 py-2">Do them in any order</span>
          </div>
        </Container>
      </section>
      <Container className="py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <CheckoutForm />
          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-fg">What happens after payment</h2>
              <ol className="mt-4 space-y-3 text-sm text-fg-muted">
                <li>1. Stripe confirms the payment server-side.</li>
                <li>2. Your client record is created.</li>
                <li>3. We email one magic link — no account or password.</li>
                <li>4. The build starts when all six steps are complete.</li>
              </ol>
            </div>
            <div className="grid gap-3">
              {stepMeta.map((s) => <div key={s.number} className="rounded-2xl border border-line bg-surface/40 p-4"><p className="text-xs font-semibold text-accent-soft">STEP {s.number} · {s.time}</p><p className="mt-1 font-medium text-fg">{s.title}</p></div>)}
            </div>
            <Link href="/portal" className="block text-sm text-accent-soft underline">Already paid? Open or resend your magic link.</Link>
          </aside>
        </div>
      </Container>
    </>
  );
}
