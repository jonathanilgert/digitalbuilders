import type { Metadata } from "next";
import { ArrowRight, Button, Container, Eyebrow, Section, SectionHeading } from "@/components/ui";
import { icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "AI Voice Agent Pricing",
  description:
    "AI voice agents for Calgary businesses from $99/month. Every plan includes a local number, call transcripts and recordings, lead delivery, and no contract.",
  alternates: {
    canonical: "/voice-agent",
  },
};

export const dynamic = "force-dynamic";

const Check = icons.check;

const plans = [
  {
    name: "After-Hours",
    monthly: "$99",
    annual: "$990/year",
    minutes: "150 minutes",
    calls: "about 60 calls",
    overage: "$0.55/min overage",
    description:
      "We answer evenings, weekends and holidays — the calls you're currently losing to voicemail.",
    features: ["Your own local number", "Leads by text and email"],
    id: "voice_afterhours",
  },
  {
    name: "Front Desk",
    monthly: "$249",
    annual: "$2,490/year",
    minutes: "500 minutes",
    calls: "about 200 calls",
    overage: "$0.45/min overage",
    description: "We answer every call you don't, all day. Nothing goes to voicemail again.",
    features: ["Everything in After-Hours", "Booking into your calendar", "Call transfers"],
    featured: true,
    id: "voice_frontdesk",
  },
  {
    name: "Front Desk Pro",
    monthly: "$449",
    annual: "$4,490/year",
    minutes: "1,200 minutes",
    calls: "about 480 calls",
    overage: "$0.35/min overage",
    description: "For busy shops with real call volume and several people to route between.",
    features: ["Everything in Front Desk", "Priority support"],
    id: "voice_pro",
  },
];

const included = [
  "A dedicated local phone number",
  "Agent build and training from your intake",
  "Call transcripts and recordings",
  "Lead delivery by SMS and email",
  "One script revision round after go-live",
  "Ongoing monitoring",
];

export default function VoiceAgentPage() {
  const checkoutEnabled = process.env.VOICE_AGENT_CHECKOUT_ENABLED === "true";
  const purchaseHref = checkoutEnabled ? "/portal/voice/start" : "/contact?service=voice-agent";
  const purchaseLabel = checkoutEnabled ? "Build my voice agent" : "Talk to us about a pilot";
  return (
    <>
      <section className="bg-aurora relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow>AI voice agents · All prices in CAD</Eyebrow>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.07] tracking-tight sm:text-6xl">
              A real front desk, for less than a <span className="text-gradient">day of wages.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-fg-muted sm:text-xl">
              Your phone gets answered every time — after hours, during a job, or when three people
              call at once. Your agent answers questions, takes the details, books the work, and
              texts you the lead before the caller hangs up.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={purchaseHref}>
                {purchaseLabel}
                <ArrowRight />
              </Button>
              <Button href="#plans" variant="secondary">
                Compare plans
              </Button>
            </div>
            <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-fg-muted">
              {["Month-to-month", "No contract", "Cancel any time"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="text-accent [&_svg]:h-4 [&_svg]:w-4" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section id="plans" className="border-y border-line bg-navy/40">
        <SectionHeading
          eyebrow="Simple pricing"
          title="Choose how often you need us to pick up."
          intro="Pay monthly and cancel any time, or pay for ten months and get twelve. Every plan is metered in talk time, with an approximate call count to make comparison easy."
          align="center"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`card relative flex flex-col p-7 sm:p-8 ${
                plan.featured
                  ? "border-accent/60 shadow-[0_24px_70px_-30px_rgba(29,78,216,0.5)]"
                  : ""
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-2xl font-semibold text-fg">{plan.name}</h2>
              <p className="mt-3 min-h-16 text-sm leading-relaxed text-fg-muted">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tracking-tight text-fg">
                  {plan.monthly}
                </span>
                <span className="text-sm text-fg-subtle">/month</span>
              </div>
              <p className="mt-2 text-sm font-medium text-accent">{plan.annual} · two months free</p>

              <div className="mt-6 rounded-2xl border border-line bg-navy/60 p-5">
                <p className="font-display text-lg font-semibold text-fg">{plan.minutes}</p>
                <p className="mt-1 text-sm text-fg-muted">{plan.calls}</p>
                <p className="mt-3 border-t border-line pt-3 text-sm font-medium text-fg">
                  {plan.overage}
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-fg-muted">
                    <Check className="mt-0.5 shrink-0 text-accent [&_svg]:h-4 [&_svg]:w-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Button
                  href={checkoutEnabled ? `/portal/voice/start?plan=${plan.id}` : `/contact?service=voice-agent&plan=${plan.id}`}
                  variant={plan.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  {checkoutEnabled ? `Choose ${plan.name}` : `Ask about ${plan.name}`}
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="card mt-6 flex flex-col justify-between gap-6 p-7 sm:p-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">One-time setup</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-fg">$499 before go-live</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted sm:text-base">
              We build it, train it on your business, test it, and you approve it before it ever
              answers a real call.
            </p>
          </div>
          <Button href={purchaseHref} variant="secondary" className="shrink-0">
            {checkoutEnabled ? "Start setup" : "Join the pilot"}
            <ArrowRight />
          </Button>
        </div>
      </Section>

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Every plan includes"
            title="A working front desk, not another DIY tool."
            intro="We configure the agent, connect the handoffs, and monitor it after launch. You get the operational pieces your team needs from day one."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {included.map((feature) => (
              <div key={feature} className="card flex items-start gap-4 p-5">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Check className="[&_svg]:h-4 [&_svg]:w-4" />
                </span>
                <p className="text-sm font-medium leading-relaxed text-fg">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-y border-line bg-navy/40">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">No lock-in</p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-fg">
              Month-to-month. No contract. Cancel any time.
            </h2>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Your phone number stays yours — port it out or switch the forwarding off whenever you
              like. Your call recordings and transcripts are yours too, and we’ll export them for
              you on request, at no charge, including if you leave.
            </p>
            <p className="mt-4 font-medium text-fg">
              We’d rather earn the next month than trap you in it.
            </p>
          </div>

          <div className="card p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              An honest note about usage
            </p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-fg">
              We bill minutes and show calls.
            </h2>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Every plan includes a set number of minutes because that’s what the technology
              actually costs to run. The call counts are estimates based on an average 2.5-minute
              call; your actual mix will vary. We bill the minutes your agent talks, not the number
              of calls.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              If you go over, the agent keeps answering. You’ll see your usage before you see an
              overage on a bill — and if it happens two months in a row, we’ll help move you to the
              plan that fits instead of letting a bigger bill become the norm.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="bg-aurora overflow-hidden rounded-[2rem] border border-line px-6 py-14 text-center shadow-[0_25px_80px_-45px_rgba(29,78,216,0.45)] sm:px-12 sm:py-16">
          <Eyebrow>Stop sending good work to voicemail</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            One captured job can pay for a year of Front Desk.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
            Tell us how your business handles calls. We’ll build and test your agent before it
            answers a customer.
          </p>
          <div className="mt-8">
            <Button href={purchaseHref}>
              {checkoutEnabled ? "Start your voice agent" : "Talk to us about a pilot"}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
