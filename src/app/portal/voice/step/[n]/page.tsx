import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { voiceStepMeta } from "@/lib/portal/types";
import { VoiceStepForm } from "@/components/portal/voice-step-form";
export const dynamic = "force-dynamic";
export default async function VoiceStepPage({params}:{params:Promise<{n:string}>}) { const client=await requireClient(); const n=Number((await params).n); const meta=voiceStepMeta.find((s)=>s.number===n); if(!meta) notFound(); const db=await readDb(); const agent=db.voice_agents.find((a)=>a.client_id===client.id); if(!agent) notFound(); const step=db.voice_steps.find((s)=>s.voice_agent_id===agent.id&&s.step_number===n); return <section className="pt-36 pb-20"><Container><div className="mb-8"><Eyebrow>Voice step {n} · {meta.time}</Eyebrow><h1 className="mt-5 font-display text-4xl font-semibold text-fg">{meta.title}</h1><p className="mt-3 text-sm text-fg-muted">Autosaves while you type. Nothing here requires you to leave this form.</p></div><div className="card p-6 sm:p-8"><VoiceStepForm number={n} initial={step?.data||{}} state={step?.state||"not_started"} businessName={client.business_name} plan={agent.plan} /></div></Container></section>; }
