"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/ui";
import { voicePlans, voiceSetupAmount, type VoicePlan } from "@/lib/portal/types";

const field = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle";

export function VoiceCheckoutForm({ initialPlan = "voice_frontdesk" }: { initialPlan?: VoicePlan }) {
  const [plan, setPlan] = useState<VoicePlan>(initialPlan);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [coupon, setCoupon] = useState("");
  const [setupAmount, setSetupAmount] = useState(voiceSetupAmount);
  const [message, setMessage] = useState("");
  async function applyCode() {
    setMessage("Checking…");
    const res = await fetch("/api/portal/voice/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coupon }) });
    const json = await res.json();
    if (!res.ok) { setSetupAmount(voiceSetupAmount); setMessage(json.error || "That code could not be applied."); return; }
    setSetupAmount(json.amount);
    setMessage(json.coupon ? `Code applied — $${((voiceSetupAmount - json.amount) / 100).toLocaleString("en-CA")} off setup` : "Standard setup price.");
  }
  return <form action="/api/portal/voice/checkout" method="post" className="card p-6 sm:p-8">
    <h2 className="font-display text-2xl font-semibold text-fg">Choose your front desk</h2>
    <p className="mt-2 text-sm text-fg-muted">Pay setup today. Your monthly or annual plan starts only after your test call is approved and the agent goes live.</p>
    <input type="hidden" name="plan" value={plan} />
    <input type="hidden" name="billing_interval" value={interval} />
    <div className="mt-6 grid gap-4">
      {(Object.keys(voicePlans) as VoicePlan[]).map((id) => { const p = voicePlans[id]; return <label key={id} className={`flex cursor-pointer gap-4 rounded-2xl border bg-surface/40 p-4 transition ${plan === id ? "border-accent ring-2 ring-accent/20" : "border-line hover:border-accent/50"}`}><input type="radio" checked={plan === id} onChange={() => setPlan(id)} className="mt-1" /><span><span className="block font-display text-lg font-semibold text-fg">{p.name} — ${(p.monthly / 100).toLocaleString("en-CA")}/month</span><span className="mt-1 block text-sm text-fg-muted">{p.minutes.toLocaleString("en-CA")} minutes · about {p.calls} calls · ${(p.overage / 100).toFixed(2)}/minute overage</span></span></label>; })}
    </div>
    <div className="mt-5 flex gap-2 rounded-2xl border border-line bg-surface/40 p-1.5" aria-label="Billing frequency">
      <button type="button" onClick={() => setInterval("month")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${interval === "month" ? "bg-accent text-ink" : "text-fg-muted"}`}>Monthly</button>
      <button type="button" onClick={() => setInterval("year")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${interval === "year" ? "bg-accent text-ink" : "text-fg-muted"}`}>Annual · two months free</button>
    </div>
    <label className="mt-6 block text-sm font-medium text-fg-muted" htmlFor="voice-coupon">Got a setup code? Enter it here</label>
    <div className="mt-2 flex gap-2"><input id="voice-coupon" name="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} className={field} placeholder="voice26" /><button type="button" onClick={applyCode} className="rounded-xl border border-line px-4 text-sm text-fg">Apply</button></div>
    {message && <p className="mt-2 text-sm text-accent-soft" role="status">{message}</p>}
    <div className="mt-5 rounded-2xl border border-line bg-surface/40 p-4"><p className="text-sm text-fg-muted">Due today — setup only</p><p className="font-display text-3xl font-bold text-fg">${(setupAmount / 100).toLocaleString("en-CA")} CAD</p><p className="mt-1 text-xs text-fg-subtle">Then ${(interval === "year" ? voicePlans[plan].annual : voicePlans[plan].monthly) / 100}{interval === "year" ? "/year" : "/month"} starting at go-live.</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-sm text-fg-muted">Business name</span><input name="business_name" required className={field} /></label><label><span className="mb-1.5 block text-sm text-fg-muted">Your name (optional)</span><input name="contact_name" className={field} /></label><label><span className="mb-1.5 block text-sm text-fg-muted">Email</span><input name="email" required type="email" className={field} /></label><label><span className="mb-1.5 block text-sm text-fg-muted">Lead delivery phone (optional)</span><input name="phone" className={field} /></label></div>
    <button className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft" type="submit">Pay setup securely <ArrowRight /></button>
  </form>;
}
