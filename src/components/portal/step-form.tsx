"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "@/components/ui";

const cls = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle";
const label = "mb-1.5 block text-sm font-medium text-fg-muted";

type Props = { number: number; initial: Record<string, unknown>; state: string };
const templates = ["Classic", "Bold", "Craftsman", "Response", "Modern"];
const categories = ["work", "team", "equipment", "logo", "other"];
function str(data: Record<string, unknown>, key: string) { return String(data[key] || ""); }

export function StepForm({ number, initial, state }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initial || {});
  const [saveState, setSaveState] = useState(state);
  const [message, setMessage] = useState("");
  const body = useMemo(() => JSON.stringify({ data, state: saveState }), [data, saveState]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (JSON.stringify(initial || {}) === JSON.stringify(data) && saveState === state) return;
      fetch(`/api/portal/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body }).then(() => setMessage("Saved"));
    }, 800);
    return () => clearTimeout(t);
  }, [body, data, initial, number, saveState, state]);
  function update(key: string, value: unknown) { setData((d) => ({ ...d, [key]: value })); setSaveState((s) => s === "complete" ? "complete" : "draft"); }
  async function markComplete() { await fetch(`/api/portal/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, state: "complete" }) }); setSaveState("complete"); setMessage("Marked complete"); window.location.href = "/portal/dashboard"; }
  async function saveClose() { await fetch(`/api/portal/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, state: saveState === "complete" ? "complete" : "draft" }) }); window.location.href = "/portal/dashboard"; }
  return <div className="space-y-5">
    {number === 1 && <div className="grid gap-4 sm:grid-cols-2">{templates.map(t => <label key={t} className="rounded-2xl border border-line bg-surface/40 p-4"><input type="radio" name="template" checked={str(data,"template_id")===t} onChange={() => update("template_id", t)} /> <span className="ml-2 font-medium text-fg">{t}</span><p className="mt-2 text-sm text-fg-muted">Preview-ready template suited to trades websites.</p></label>)}<input className={cls} placeholder="Brand colours or use my logo colours" value={str(data,"brand_colours")} onChange={e=>update("brand_colours",e.target.value)} /></div>}
    {number === 2 && <div className="space-y-4"><select className={cls} value={str(data,"photo_mode")} onChange={e=>update("photo_mode",e.target.value)}><option value="">Choose photo path</option><option value="uploaded">Upload my own photos</option><option value="stock">Use professional stock photos</option><option value="generated">Have images generated for my site</option></select><textarea className={cls} rows={4} placeholder="Photo notes, stock categories, or generated image requests" value={str(data,"photo_notes")} onChange={e=>update("photo_notes",e.target.value)} /> <form action="/api/portal/assets" method="post" encType="multipart/form-data" className="rounded-2xl border border-line p-4"><label className={label}>Upload images/logo</label><input type="file" name="files" accept="image/*,.heic,.heif" capture="environment" multiple className="text-sm text-fg-muted" /><select name="category" className={`${cls} mt-3`}>{categories.map(c=><option key={c}>{c}</option>)}</select><button className="mt-3 rounded-full border border-line px-4 py-2 text-sm text-fg">Upload files</button></form></div>}
    {number === 3 && <div className="grid gap-4"><select className={cls} value={str(data,"domain_mode")} onChange={e=>update("domain_mode",e.target.value)}><option value="">Choose domain path</option><option value="register_for_me">Register one for me</option><option value="already_own">I already have one</option><option value="undecided">Not sure yet</option></select><input className={cls} placeholder="Domain choice 1 or existing domain" value={str(data,"domain_1")} onChange={e=>update("domain_1",e.target.value)} /><input className={cls} placeholder="Domain choice 2" value={str(data,"domain_2")} onChange={e=>update("domain_2",e.target.value)} /><input className={cls} placeholder="Domain choice 3" value={str(data,"domain_3")} onChange={e=>update("domain_3",e.target.value)} /><input className={cls} placeholder="Current registrar" value={str(data,"registrar")} onChange={e=>update("registrar",e.target.value)} /><label className="text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.has_domain_email)} onChange={e=>update("has_domain_email",e.target.checked)} /> I receive email at this domain</label><select className={cls} value={str(data,"cira_legal_type")} onChange={e=>update("cira_legal_type",e.target.value)}><option value="">CIRA legal type</option><option>Canadian Citizen</option><option>Permanent Resident</option><option>Canadian Corporation</option><option>Canadian Partnership</option></select></div>}
    {number === 4 && <div className="grid gap-4 sm:grid-cols-2">{["legal_name","trade_name","phone","email","address","service_areas","years_in_business","licences","certifications","social_links"].map(k=><input key={k} className={cls} placeholder={k.replaceAll("_"," ")} value={str(data,k)} onChange={e=>update(k,e.target.value)} />)}</div>}
    {number === 5 && <div className="space-y-4">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day=><div key={day} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]"><span className="text-sm text-fg-muted">{day}</span><input className={cls} placeholder="Open" value={str(data,`${day}_open`)} onChange={e=>update(`${day}_open`,e.target.value)} /><input className={cls} placeholder="Close / closed" value={str(data,`${day}_close`)} onChange={e=>update(`${day}_close`,e.target.value)} /></div>)}<label className="block text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.emergency_24_7)} onChange={e=>update("emergency_24_7",e.target.checked)} /> 24/7 emergency line</label><label className="block text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.by_appointment)} onChange={e=>update("by_appointment",e.target.checked)} /> By appointment only</label><textarea className={cls} rows={3} placeholder="Seasonal hours or notes" value={str(data,"hours_note")} onChange={e=>update("hours_note",e.target.value)} /></div>}
    {number === 6 && <div className="grid gap-4">{["What do you do?", "What should someone call you for first?", "Why do customers pick you over the other guy?", "What areas do you serve?", "Anything you want said in your own words?", "Guarantees, warranties, financing?"].map((q,i)=><label key={q}><span className={label}>{q}</span><textarea className={cls} rows={4} value={str(data,`q${i+1}`)} onChange={e=>update(`q${i+1}`,e.target.value)} /></label>)}</div>}
    <div className="flex flex-wrap items-center gap-3"><button onClick={saveClose} className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-fg">Save & close</button><button onClick={markComplete} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Mark complete <ArrowRight /></button><span className="text-sm text-fg-subtle">{message}</span></div>
  </div>;
}
