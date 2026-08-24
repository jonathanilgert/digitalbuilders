import { Container, Eyebrow, Section } from "@/components/ui";
import { IntakeForm } from "@/components/intake-form";

const steps = [
  ["Choose the build", "Pick One-Pager, Essential, Professional, store, or custom."],
  ["Business details", "Tell us who you are, what you do, and where you work."],
  ["Domain", "Share a current domain or the names you want us to check."],
  ["Photos", "Use your own, curated stock, generated imagery, or a mix."],
  ["Hours", "Give us regular hours, emergency availability, and seasonal notes."],
  ["Guided content", "Answer plain-language prompts so we can write the copy."],
];

export const metadata = {
  title: "Website Intake — Digital Builders",
  description: "Start a Digital Builders website by sending the details needed to scope and build your site.",
};

export default function IntakePage() {
  return (
    <>
      <section className="bg-aurora relative overflow-hidden pt-36 pb-14 sm:pt-44 sm:pb-20">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Website Intake</Eyebrow>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-6xl">
              Start your website without booking a call first.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
              No technical knowledge needed. Answer the questions, send whatever details you have, and we will use this intake to prepare your build. One-page sites can be built in about one week once the details are complete.
            </p>
          </div>
        </Container>
      </section>

      <Section className="pt-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-5">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-fg">What this collects</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                This is the practical intake form for starting a website today. The full payment-gated client portal with magic links, autosave, uploads, Stripe, previews, and admin tools is still a separate build from the August 2026 portal spec.
              </p>
            </div>
            <div className="grid gap-3">
              {steps.map(([title, body], index) => (
                <div key={title} className="rounded-2xl border border-line bg-surface/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 font-display text-base font-semibold text-fg">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{body}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="card p-5 sm:p-8">
            <IntakeForm />
          </div>
        </div>
      </Section>
    </>
  );
}
