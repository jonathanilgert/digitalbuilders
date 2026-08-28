import Link from "next/link";
import { Container, Eyebrow, Button } from "@/components/ui";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Details submitted — Digital Builders Portal" };

export default async function SubmittedPage() {
  const client = await requireClient();
  const db = await readDb();
  const steps = db.steps.filter((s) => s.client_id === client.id);
  const done = steps.filter((s) => s.state === "complete").length;
  const complete = done === 6;

  return (
    <section className="pt-36 pb-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>{complete ? "Details submitted" : "Intake saved"}</Eyebrow>
          <div className="mt-8 rounded-[2rem] border border-line bg-surface/70 p-8 shadow-2xl shadow-black/20 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl text-ink">✓</div>
            <h1 className="mt-6 font-display text-4xl font-semibold text-fg sm:text-5xl">
              {complete ? "Your website details have been submitted." : "Your website intake is almost ready."}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-fg-muted">
              {complete
                ? "Thanks — Digital Builders has everything needed to begin preparing your website build. We’ll review your intake, organize your content, and touch base once your site is ready to preview."
                : "Your progress is saved. Finish the remaining intake steps and mark each one complete when you’re ready for Digital Builders to begin the build."}
            </p>
            <div className="mt-8 rounded-2xl border border-line bg-ink/45 p-5 text-left">
              <h2 className="font-display text-xl font-semibold text-fg">What happens next?</h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-fg-muted">
                <li><strong className="text-fg">1.</strong> Digital Builders reviews your answers, uploaded files, domain details, and business information.</li>
                <li><strong className="text-fg">2.</strong> We begin building your website from the submitted intake.</li>
                <li><strong className="text-fg">3.</strong> You’ll hear from us when the first preview is ready, with a link to review and request included tweaks.</li>
              </ol>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/portal/dashboard" variant="secondary">Back to intake dashboard</Button>
              <Link href="mailto:hello@digitalbuilders.ca" className="text-sm font-semibold text-accent-soft underline underline-offset-4">Questions? Email Digital Builders</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
