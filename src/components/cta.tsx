import { Container, Button, ArrowRight } from "@/components/ui";
import { ctaText, site } from "@/lib/content";

export function CtaSection({ id }: { id?: string }) {
  return (
    <section id={id} className="py-20 sm:py-28">
      <Container>
        <div className="card relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="bg-aurora pointer-events-none absolute inset-0 opacity-80" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/50 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent-soft">
              Let&apos;s Connect
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Let&apos;s build something that works as hard as you do.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {ctaText}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={site.bookingUrl}>
                Start Intake
                <ArrowRight />
              </Button>
              <Button href="/contact" variant="secondary">
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
