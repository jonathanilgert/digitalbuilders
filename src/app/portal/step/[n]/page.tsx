import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { stepMeta } from "@/lib/portal/types";
import { StepForm } from "@/components/portal/step-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Step — Digital Builders" };
export default async function StepPage({ params }: { params: Promise<{ n: string }> }) {
  const client = await requireClient();
  const n = Number((await params).n);
  const meta = stepMeta.find((s) => s.number === n);
  if (!meta) notFound();
  const db = await readDb();
  const step = db.steps.find((s) => s.client_id === client.id && s.step_number === n);
  return <section className="pt-36 pb-20"><Container><div className="mb-8"><Eyebrow>Step {n} · {meta.time}</Eyebrow><h1 className="mt-5 font-display text-4xl font-semibold text-fg">{meta.title}</h1><p className="mt-3 text-sm text-fg-muted">Autosaves while you type. Use Save & close for a draft or Mark complete when this step is ready.</p></div><div className="card p-6 sm:p-8"><StepForm number={n} initial={step?.data || {}} state={step?.state || "not_started"} /></div></Container></section>;
}
