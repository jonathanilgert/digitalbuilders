"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "@/components/ui";
import { plans, type Plan } from "@/lib/portal/types";

export function CheckoutForm() {
  const [plan, setPlan] = useState<Plan>("1page");
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [amount, setAmount] = useState(plans[plan].amount);
  const saving = useMemo(() => plans[plan].amount - amount, [amount, plan]);
  async function applyCode() {
    setCouponMessage("Checking…");
    const res = await fetch("/api/portal/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, coupon }) });
    const json = await res.json();
    if (!res.ok) { setAmount(plans[plan].amount); setCouponMessage(json.error || "That code could not be applied."); return; }
    setAmount(json.amount);
    setCouponMessage(json.coupon ? `Code applied — $${((plans[plan].amount - json.amount) / 100).toLocaleString("en-CA")} off` : "No code applied — standard price.");
  }
  function choose(next: Plan) { setPlan(next); setAmount(plans[next].amount); setCouponMessage(""); }
  return <form action="/api/portal/checkout" method="post" className="card p-6 sm:p-8">
    <h2 className="font-display text-2xl font-semibold text-fg">Choose your build</h2>
    <input type="hidden" name="plan" value={plan} />
    <div className="mt-6 grid gap-4">
      {(Object.keys(plans) as Plan[]).map((id) => <label key={id} className="flex cursor-pointer gap-4 rounded-2xl border border-line bg-surface/40 p-4 transition hover:border-accent/50"><input type="radio" checked={plan === id} onChange={() => choose(id)} className="mt-1" /><span><span className="block font-display text-lg font-semibold text-fg">{plans[id].name} — ${(plans[id].amount / 100).toLocaleString("en-CA")}</span><span className="mt-1 block text-sm leading-relaxed text-fg-muted">{plans[id].summary}</span></span></label>)}
    </div>
    <label className="mt-6 block text-sm font-medium text-fg-muted" htmlFor="coupon">Got a code? Enter it here</label>
    <div className="mt-2 flex gap-2"><input id="coupon" name="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg outline-none focus:border-accent" placeholder="truetrades26" /><button type="button" onClick={applyCode} className="rounded-xl border border-line px-4 text-sm text-fg">Apply</button></div>
    {couponMessage && <p className={`mt-2 text-sm ${saving > 0 ? "text-accent-soft" : "text-fg-subtle"}`}>{couponMessage}</p>}
    <div className="mt-5 rounded-2xl border border-line bg-surface/40 p-4"><p className="text-sm text-fg-muted">Checkout total</p><p className="font-display text-3xl font-bold text-fg">${(amount / 100).toLocaleString("en-CA")} CAD</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><input name="business_name" required className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" placeholder="Business name" /><input name="contact_name" required className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" placeholder="Your name" /><input name="email" required type="email" className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" placeholder="Email" /><input name="phone" required className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" placeholder="Phone" /></div>
    <button className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft" type="submit">Continue to secure checkout <ArrowRight /></button>
  </form>;
}
