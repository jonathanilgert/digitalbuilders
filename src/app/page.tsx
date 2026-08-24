import { Container, Section, SectionHeading, Eyebrow, Button, ArrowRight } from "@/components/ui";
import { CtaSection } from "@/components/cta";
import { Faq } from "@/components/faq";
import { ProjectCard } from "@/components/project-card";
import { icons } from "@/components/icons";
import {
  site,
  stats,
  features,
  services,
  process,
  pricing,
  carePlan,
  ownershipPromise,
  pricingNotes,
  voiceAI,
  projects,
} from "@/lib/content";

const Check = icons.check;

export default function Home() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="bg-aurora relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Calgary digital studio · est. {site.founded}</Eyebrow>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.07] tracking-tight sm:text-6xl">
              We build <span className="text-gradient">modern websites</span> that turn visitors
              into customers.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
              {site.tagline} We design platforms that feel intuitive, engaging, and built to
              perform — for local businesses, online stores, and growing brands.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={site.bookingUrl} external>
                Book a Call
                <ArrowRight />
              </Button>
              <Button href="/work" variant="secondary">
                View our portfolio
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:mt-20 lg:grid-cols-4">
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
      </section>

      {/* ---------------- About ---------------- */}
      <Section id="about">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="About us"
              title="An experienced team with a passion for the modern web."
              intro="Digital Builders is a forward-thinking creative studio built on passion, collaboration, and innovation. We turn bold ideas into impactful designs and digital experiences that help brands stand out, connect, and grow with confidence."
            />
            <Button href="/about" variant="secondary" className="mt-8">
              Know more
              <ArrowRight />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.slice(0, 4).map((f) => (
              <div key={f.title} className="card card-hover p-6">
                <h3 className="font-display text-lg font-semibold text-fg">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------- Services ---------------- */}
      <Section id="services" className="border-y border-line bg-navy/40">
        <SectionHeading
          eyebrow="Our services"
          title="Everything you need to launch and grow online."
          intro="From a first website to a full e-commerce platform, we cover design, build, and the technology that ties it together."
          align="center"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = icons[s.icon];
            return (
              <div key={s.title} className="card card-hover p-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink/60 text-accent">
                  {Icon && <Icon className="[&_svg]:h-6 [&_svg]:w-6" />}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button href="/services" variant="secondary">
            See all services
            <ArrowRight />
          </Button>
        </div>
      </Section>

      {/* ---------------- Process ---------------- */}
      <Section id="process">
        <SectionHeading
          eyebrow="Our process"
          title="A clear path from first idea to launch."
          intro="No guesswork and no surprises — just four focused steps that keep your project moving."
          align="center"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((p) => (
            <div key={p.step} className="card card-hover relative p-7">
              <span className="font-display text-4xl font-bold text-accent/30">{p.step}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- Work preview ---------------- */}
      <Section className="border-y border-line bg-navy/40">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Selected work" title="A look at what we've built." />
          <Button href="/work" variant="secondary">
            View all work
            <ArrowRight />
          </Button>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
      </Section>

      {/* ---------------- Pricing ---------------- */}
      <Section id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Websites for trades, built properly and priced honestly."
          intro="You don't need to know anything about building websites. Answer some questions, send a few photos — we do the rest. Live in about two weeks. All figures in CAD."
          align="center"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {pricing.map((tier) => (
            <div
              key={tier.name}
              className={`card relative flex flex-col p-8 ${
                tier.featured ? "border-accent/60 shadow-[0_24px_70px_-30px_rgba(29,78,216,0.5)]" : ""
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold text-fg">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-fg">{tier.price}</span>
                <span className="text-sm text-fg-subtle">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-fg-muted">{tier.tagline}</p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-fg-muted">
                    <Check className="mt-0.5 text-accent [&_svg]:h-4 [&_svg]:w-4" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Button
                  href={site.bookingUrl}
                  external
                  variant={tier.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  Get started
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6">
          <div className="card p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">No lock-in</p>
            <h3 className="mt-3 font-display text-xl font-semibold text-fg">{ownershipPromise.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{ownershipPromise.body}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface/40 p-6">
          <p className="text-sm font-semibold text-fg">Included and scope limits</p>
          <ul className="mt-4 grid gap-3 lg:grid-cols-3">
            {pricingNotes.map((note) => (
              <li key={note} className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
                <Check className="mt-0.5 text-accent [&_svg]:h-4 [&_svg]:w-4" />
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Care plan */}
        <div className="card mt-6 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-xl font-semibold text-fg">{carePlan.name}</h3>
              <span className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-accent">{carePlan.price}</span>
                <span className="text-sm text-fg-subtle">{carePlan.cadence}</span>
              </span>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-fg-muted">
                {carePlan.annualPrice}
              </span>
            </div>
            <p className="mt-2 text-sm text-fg-muted">{carePlan.tagline}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {carePlan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-fg-muted">
                  <Check className="text-accent [&_svg]:h-4 [&_svg]:w-4" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Button href="/contact" variant="secondary" className="shrink-0">
            Add a Care Plan
            <ArrowRight />
          </Button>
        </div>
      </Section>

      {/* ---------------- VoiceAI ---------------- */}
      <Section id="voiceai" className="border-y border-line bg-navy/40">
        <SectionHeading
          eyebrow="VoiceAI"
          title="Never miss a customer — even when you're off the clock."
          intro="Add AI-powered voice and messaging to your business so every call and chat gets answered, qualified, and followed up."
          align="center"
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
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

      {/* ---------------- FAQ ---------------- */}
      <Section id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered."
          intro="Curious about working with us? Here are answers that make our process clear and simple."
          align="center"
        />
        <div className="mx-auto max-w-3xl">
          <Faq />
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
