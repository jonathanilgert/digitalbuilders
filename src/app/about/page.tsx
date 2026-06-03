import type { Metadata } from "next";
import { Section, SectionHeading, Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { CtaSection } from "@/components/cta";
import { stats, values } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Digital Builders is a Calgary creative studio shaping brands through design, strategy, and technology — delivering impactful solutions that drive growth.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            We&apos;re a team of passionate creatives shaping brands through{" "}
            <span className="text-gradient">design, strategy, and technology</span>.
          </>
        }
        intro="Delivering impactful solutions that drive growth and lasting success — for businesses across industries."
      />

      {/* Stats */}
      <Container>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-navy px-6 py-8 text-center">
              <div className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-sm text-fg-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Story */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Who we are"
            title="A forward-thinking creative studio."
            intro="Digital Builders is built on passion, collaboration, and innovation. We transform bold ideas into impactful designs and digital experiences that empower brands to stand out, inspire, connect, grow, and thrive globally with confidence."
          />
          <div className="grid gap-5">
            <div className="card p-7">
              <h3 className="font-display text-lg font-semibold text-accent-soft">Our mission</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                To deliver accessible, high-quality design solutions that strengthen brands, spark
                creativity, and foster lasting audience connections across industries worldwide.
              </p>
            </div>
            <div className="card p-7">
              <h3 className="font-display text-lg font-semibold text-accent-soft">Our vision</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                To redefine brand experiences by crafting innovative solutions that inspire growth,
                elevate creativity, and empower businesses to succeed in today&apos;s evolving
                digital landscape.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section className="border-y border-line bg-navy/40">
        <SectionHeading
          eyebrow="Our values"
          title="What guides every project."
          align="center"
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {values.map((v, i) => (
            <div key={v.title} className="card card-hover p-8">
              <span className="font-display text-3xl font-bold text-accent/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-fg">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
