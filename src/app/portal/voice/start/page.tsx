import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { VoiceCheckoutForm } from "@/components/portal/voice-checkout-form";
import { voicePlans, voiceStepMeta, type VoicePlan } from "@/lib/portal/types";

export const metadata = {
  title: "Start an AI Voice Agent — Digital Builders",
  description: "Pay the setup fee, then complete a 12-minute, no-password voice-agent intake.",
};

export const dynamic = "force-dynamic";

export default async function VoiceStartPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  if (process.env.VOICE_AGENT_CHECKOUT_ENABLED !== "true") {
    return <>
      <section className="bg-aurora pt-36 pb-16 sm:pt-44 sm:pb-20">
        <Container>
          <Eyebrow>AI voice agent pilot</Eyebrow>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-tight text-fg sm:text-6xl">We’re onboarding voice-agent pilots personally.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">Online setup payments are not open yet. Tell us about your call volume and workflow, and we’ll confirm whether the pilot is a fit before taking payment.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact?service=voice-agent" className="button">Talk to us about a pilot</Link>
            <Link href="/voice-agent" className="button secondary">Review plans</Link>
          </div>
        </Container>
      </section>
      <Container className="py-16">
        <Link href="/portal" className="text-sm text-accent-soft underline">Already have a magic link? Open your portal.</Link>
      </Container>
    </>;
  }

  const requested = (await searchParams).plan as VoicePlan;
  const initialPlan = voicePlans[requested] ? requested : "voice_frontdesk";
  return <>
    <section className="bg-aurora pt-36 pb-16 sm:pt-44 sm:pb-20">
      <Container>
        <Eyebrow>AI voice agent setup</Eyebrow>
        <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-tight text-fg sm:text-6xl">A working front desk starts with twelve minutes about your business.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">Pay setup securely, then use one magic link to finish six short steps. Your recurring plan does not start until you approve the test call and go live.</p>
      </Container>
    </section>
    <Container className="py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <VoiceCheckoutForm initialPlan={initialPlan} />
        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-fg">What happens after payment</h2>
            <ol className="mt-4 space-y-3 text-sm text-fg-muted">
              <li>1. Stripe confirms the setup payment.</li>
              <li>2. We provision a local sandbox number.</li>
              <li>3. We email your no-password magic link.</li>
              <li>4. You finish the intake and approve a live test call.</li>
            </ol>
          </div>
          <div className="grid gap-3">
            {voiceStepMeta.map((step) => <div key={step.number} className="rounded-2xl border border-line bg-surface/40 p-4"><p className="text-xs font-semibold text-accent-soft">STEP {step.number} · {step.time}</p><p className="mt-1 font-medium text-fg">{step.title}</p></div>)}
          </div>
          <Link href="/portal" className="block text-sm text-accent-soft underline">Already paid? Open your magic link.</Link>
        </aside>
      </div>
    </Container>
  </>;
}
