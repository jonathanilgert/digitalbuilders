import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { CtaSection } from "@/components/cta";
import { icons } from "@/components/icons";
import { services, process, voiceAI } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "UI/UX design, custom website development, Framer, Webflow, Shopify e-commerce, and mobile apps — plus VoiceAI for calls and messaging.",
};

const Check = icons.check;

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title={
          <>
            A tailored approach that delivers{" "}
            <span className="text-gradient">innovative, high-quality results</span>.
          </>
        }
        intro="One-page builds start at $599, Essential three-page sites are $999, Professional sites up to five pages are $1,495, online stores start from $2,950, and custom builds start from $5,000 — with clear scope before any work begins."
      />

      <Section className="pt-4">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = icons[s.icon];
            return (
              <div key={s.title} className="card card-hover p-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink/60 text-accent">
                  {Icon && <Icon className="[&_svg]:h-6 [&_svg]:w-6" />}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* VoiceAI */}
      <Section className="border-y border-line bg-navy/40">
        <SectionHeading
          eyebrow="VoiceAI"
          title="AI that answers when you can't."
          intro="Layer voice and conversational AI onto your business to capture every call and message, around the clock."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {voiceAI.map((v, i) => {
            const Icon = i === 0 ? icons.phoneCall : icons.chat;
            return (
              <div key={v.title} className="card card-hover p-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink/60 text-accent">
                  <Icon className="[&_svg]:h-6 [&_svg]:w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-fg">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{v.body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Process */}
      <Section>
        <SectionHeading
          eyebrow="Our process"
          title="How we work, step by step."
          align="center"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((p) => (
            <div key={p.step} className="card card-hover p-7">
              <span className="font-display text-4xl font-bold text-accent/30">{p.step}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line bg-surface/40 p-6 text-sm text-fg-muted">
          <span className="font-medium text-fg">Always included:</span>
          <span className="flex items-center gap-2">
            <Check className="text-accent [&_svg]:h-4 [&_svg]:w-4" /> Responsive, mobile-first design
          </span>
          <span className="flex items-center gap-2">
            <Check className="text-accent [&_svg]:h-4 [&_svg]:w-4" /> Speed &amp; SEO optimization
          </span>
          <span className="flex items-center gap-2">
            <Check className="text-accent [&_svg]:h-4 [&_svg]:w-4" /> Quote form and click-to-call
          </span>
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
