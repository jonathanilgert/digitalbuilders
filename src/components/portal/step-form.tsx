"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "@/components/ui";
import type { Asset } from "@/lib/portal/types";

const cls = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle";
const label = "mb-1.5 block text-sm font-medium text-fg-muted";

type Props = { number: number; initial: Record<string, unknown>; state: string; assets?: Asset[] };
type TemplateOption = {
  id: string;
  name: string;
  words: string;
  description: string;
  accent: string;
  bg: string;
  layout: "classic" | "bold" | "craftsman" | "response" | "modern";
};

const templates: TemplateOption[] = [
  {
    id: "classic",
    name: "Classic",
    words: "Traditional · trustworthy · clear",
    description: "A polished service-business layout with a calm hero, simple sections, and familiar navigation.",
    accent: "bg-blue-500",
    bg: "from-slate-100 to-white",
    layout: "classic",
  },
  {
    id: "bold",
    name: "Bold",
    words: "High-contrast · confident · memorable",
    description: "A punchier landing page with large headings, strong CTAs, and energetic visual blocks.",
    accent: "bg-orange-500",
    bg: "from-zinc-950 to-zinc-800",
    layout: "bold",
  },
  {
    id: "craftsman",
    name: "Craftsman",
    words: "Local · handmade · grounded",
    description: "Warm textures and practical service cards for trades, home services, builders, and local experts.",
    accent: "bg-amber-700",
    bg: "from-stone-200 to-amber-50",
    layout: "craftsman",
  },
  {
    id: "response",
    name: "Response",
    words: "Urgent · conversion-first · phone-ready",
    description: "Built around fast calls, quotes, service areas, and emergency-style trust signals.",
    accent: "bg-emerald-500",
    bg: "from-emerald-950 to-slate-900",
    layout: "response",
  },
  {
    id: "modern",
    name: "Modern",
    words: "Minimal · spacious · refined",
    description: "Clean spacing, soft gradients, and contemporary cards for a sleek professional feel.",
    accent: "bg-sky-400",
    bg: "from-sky-50 to-indigo-100",
    layout: "modern",
  },
];

const categories = ["work", "team", "equipment", "logo", "other"];
function str(data: Record<string, unknown>, key: string) { return String(data[key] || ""); }
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MiniTemplate({ template, selected }: { template: TemplateOption; selected: boolean }) {
  const dark = template.layout === "bold" || template.layout === "response";
  const panel = dark ? "bg-white/12" : "bg-white/80";
  const muted = dark ? "bg-white/20" : "bg-slate-300/80";
  const text = dark ? "bg-white/80" : "bg-slate-800/80";

  return (
    <div className={`mt-4 overflow-hidden rounded-2xl border ${selected ? "border-accent" : "border-line"} bg-gradient-to-br ${template.bg} p-3 shadow-inner`} aria-hidden="true">
      <div className={`h-28 rounded-xl ${dark ? "bg-black/15" : "bg-white/50"} p-3`}>
        <div className="flex items-center justify-between">
          <div className={`h-2 w-12 rounded-full ${text}`} />
          <div className="flex gap-1.5">
            <div className={`h-2 w-5 rounded-full ${muted}`} />
            <div className={`h-2 w-5 rounded-full ${muted}`} />
          </div>
        </div>

        {template.layout === "classic" && (
          <div className="mt-4 grid grid-cols-[1.3fr_0.7fr] gap-3">
            <div>
              <div className={`h-3 w-20 rounded-full ${text}`} />
              <div className={`mt-2 h-2 w-28 rounded-full ${muted}`} />
              <div className={`mt-2 h-2 w-24 rounded-full ${muted}`} />
              <div className={`mt-3 h-4 w-16 rounded-full ${template.accent}`} />
            </div>
            <div className={`${panel} h-16 rounded-lg`} />
          </div>
        )}

        {template.layout === "bold" && (
          <div className="mt-4">
            <div className={`h-5 w-28 rounded-sm ${template.accent}`} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5"><div className={`h-2 rounded-full ${muted}`} /><div className={`h-2 w-3/4 rounded-full ${muted}`} /></div>
              <div className="h-11 rounded-lg bg-white/20" />
            </div>
          </div>
        )}

        {template.layout === "craftsman" && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="col-span-3 flex items-end gap-2"><div className={`h-5 w-16 rounded-sm ${text}`} /><div className={`h-3 w-10 rounded-full ${template.accent}`} /></div>
            {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg border border-amber-900/10 bg-white/65" />)}
          </div>
        )}

        {template.layout === "response" && (
          <div className="mt-4 grid grid-cols-[0.9fr_1.1fr] gap-3">
            <div className="space-y-2"><div className={`h-3 w-16 rounded-full ${text}`} /><div className={`h-2 w-20 rounded-full ${muted}`} /><div className={`h-5 w-20 rounded-full ${template.accent}`} /></div>
            <div className="rounded-lg border border-emerald-300/25 bg-white/10 p-2"><div className="h-3 rounded-full bg-emerald-300" /><div className={`mt-2 h-2 rounded-full ${muted}`} /><div className={`mt-1.5 h-2 w-2/3 rounded-full ${muted}`} /></div>
          </div>
        )}

        {template.layout === "modern" && (
          <div className="mt-4">
            <div className="mx-auto h-4 w-24 rounded-full bg-slate-900/80" />
            <div className="mx-auto mt-2 h-2 w-32 rounded-full bg-slate-400/70" />
            <div className="mt-4 grid grid-cols-3 gap-2"><div className="h-8 rounded-xl bg-white/75" /><div className="h-8 rounded-xl bg-white/90" /><div className="h-8 rounded-xl bg-white/75" /></div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StepForm({ number, initial, state, assets = [] }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initial || {});
  const [uploadedAssets, setUploadedAssets] = useState(assets);
  const [saveState, setSaveState] = useState(state);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const body = useMemo(() => JSON.stringify({ data, state: saveState }), [data, saveState]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (JSON.stringify(initial || {}) === JSON.stringify(data) && saveState === state) return;
      fetch(`/api/portal/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body }).then(() => setMessage("Saved"));
    }, 800);
    return () => clearTimeout(t);
  }, [body, data, initial, number, saveState, state]);
  function update(key: string, value: unknown) { setData((d) => ({ ...d, [key]: value })); setSaveState((s) => s === "complete" ? "complete" : "draft"); }
  async function uploadFiles(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");
    setUploading(true);
    const form = event.currentTarget;
    try {
      const res = await fetch("/api/portal/assets/", {
        method: "POST",
        headers: { Accept: "application/json", "X-Requested-With": "fetch" },
        body: new FormData(form),
      });
      const result = await res.json().catch(() => null) as { ok?: boolean; message?: string; uploaded?: Asset[] } | null;
      if (!res.ok || !result?.ok) throw new Error(result?.message || "Upload failed. Please try again.");
      const uploaded = result.uploaded || [];
      setUploadedAssets((current) => [...uploaded, ...current]);
      setUploadMessage(`${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded.`);
      form.reset();
      update("photo_mode", "uploaded");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }
  async function markComplete() { await fetch(`/api/portal/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, state: "complete" }) }); setSaveState("complete"); setMessage("Marked complete"); window.location.href = "/portal/dashboard"; }
  async function saveClose() { await fetch(`/api/portal/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, state: saveState === "complete" ? "complete" : "draft" }) }); window.location.href = "/portal/dashboard"; }
  return <div className="space-y-5">
    {number === 1 && <div className="space-y-5"><div className="grid gap-4 lg:grid-cols-2">{templates.map((t) => {
      const selected = str(data, "template_id") === t.id || str(data, "template_id") === t.name;
      return <label key={t.id} className={`block cursor-pointer rounded-2xl border bg-surface/40 p-4 transition hover:border-accent/60 ${selected ? "border-accent ring-2 ring-accent/20" : "border-line"}`}><span className="flex items-start gap-3"><input type="radio" name="template" className="mt-1" checked={selected} onChange={() => update("template_id", t.id)} /><span><span className="font-medium text-fg">{t.name}</span><span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-accent-soft">{t.words}</span><span className="mt-2 block text-sm leading-relaxed text-fg-muted">{t.description}</span></span></span><MiniTemplate template={t} selected={selected} /></label>;
    })}</div><input className={cls} placeholder="Brand colours or use my logo colours" value={str(data,"brand_colours")} onChange={e=>update("brand_colours",e.target.value)} /></div>}
    {number === 2 && <div className="space-y-5"><select className={cls} value={str(data,"photo_mode")} onChange={e=>update("photo_mode",e.target.value)}><option value="">Choose photo path</option><option value="uploaded">Upload my own photos</option><option value="stock">Use professional stock photos</option><option value="generated">Have images generated for my site</option></select><textarea className={cls} rows={4} placeholder="Photo notes, stock categories, or generated image requests" value={str(data,"photo_notes")} onChange={e=>update("photo_notes",e.target.value)} /> <form action="/api/portal/assets/" method="post" encType="multipart/form-data" onSubmit={uploadFiles} className="rounded-2xl border border-line bg-surface/30 p-4"><label className={label}>Upload images/logo</label><p className="mb-3 text-sm text-fg-muted">Choose images from your device, then tap Upload files. JPG, PNG, HEIC, and logo files up to 15 MB each are accepted.</p><input type="file" name="files" accept="image/*,.heic,.heif" multiple className="block w-full rounded-xl border border-dashed border-line bg-ink/50 px-4 py-5 text-sm text-fg-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink" /><select name="category" className={`${cls} mt-3`}>{categories.map(c=><option key={c}>{c}</option>)}</select><button type="submit" disabled={uploading} className="mt-3 rounded-full border border-line px-4 py-2 text-sm font-semibold text-fg transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60">{uploading ? "Uploading…" : "Upload files"}</button>{uploadMessage && <p className="mt-3 text-sm text-accent-soft" role="status">{uploadMessage}</p>}</form>{uploadedAssets.length > 0 && <div className="rounded-2xl border border-line bg-surface/30 p-4"><p className={label}>Uploaded files</p><ul className="space-y-2 text-sm text-fg-muted">{uploadedAssets.map((asset) => <li key={asset.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink/40 px-3 py-2"><span>{asset.original_filename}</span><span className="text-xs uppercase tracking-[0.14em] text-fg-subtle">{asset.category} · {formatBytes(asset.bytes)}</span></li>)}</ul></div>}</div>}
    {number === 3 && <div className="grid gap-4"><select className={cls} value={str(data,"domain_mode")} onChange={e=>update("domain_mode",e.target.value)}><option value="">Choose domain path</option><option value="register_for_me">Register one for me</option><option value="already_own">I already have one</option><option value="undecided">Not sure yet</option></select><input className={cls} placeholder="Domain choice 1 or existing domain" value={str(data,"domain_1")} onChange={e=>update("domain_1",e.target.value)} /><input className={cls} placeholder="Domain choice 2" value={str(data,"domain_2")} onChange={e=>update("domain_2",e.target.value)} /><input className={cls} placeholder="Domain choice 3" value={str(data,"domain_3")} onChange={e=>update("domain_3",e.target.value)} /><input className={cls} placeholder="Current registrar" value={str(data,"registrar")} onChange={e=>update("registrar",e.target.value)} /><label className="text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.has_domain_email)} onChange={e=>update("has_domain_email",e.target.checked)} /> I receive email at this domain</label><select className={cls} value={str(data,"cira_legal_type")} onChange={e=>update("cira_legal_type",e.target.value)}><option value="">CIRA legal type</option><option>Canadian Citizen</option><option>Permanent Resident</option><option>Canadian Corporation</option><option>Canadian Partnership</option></select></div>}
    {number === 4 && <div className="grid gap-4 sm:grid-cols-2">{["legal_name","trade_name","phone","email","address","service_areas","years_in_business","licences","certifications","social_links"].map(k=><input key={k} className={cls} placeholder={k.replaceAll("_"," ")} value={str(data,k)} onChange={e=>update(k,e.target.value)} />)}</div>}
    {number === 5 && <div className="space-y-4">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day=><div key={day} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]"><span className="text-sm text-fg-muted">{day}</span><input className={cls} placeholder="Open" value={str(data,`${day}_open`)} onChange={e=>update(`${day}_open`,e.target.value)} /><input className={cls} placeholder="Close / closed" value={str(data,`${day}_close`)} onChange={e=>update(`${day}_close`,e.target.value)} /></div>)}<label className="block text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.emergency_24_7)} onChange={e=>update("emergency_24_7",e.target.checked)} /> 24/7 emergency line</label><label className="block text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.by_appointment)} onChange={e=>update("by_appointment",e.target.checked)} /> By appointment only</label><textarea className={cls} rows={3} placeholder="Seasonal hours or notes" value={str(data,"hours_note")} onChange={e=>update("hours_note",e.target.value)} /></div>}
    {number === 6 && <div className="grid gap-4">{["What do you do?", "What should someone call you for first?", "Why do customers pick you over the other guy?", "What areas do you serve?", "Anything you want said in your own words?", "Guarantees, warranties, financing?"].map((q,i)=><label key={q}><span className={label}>{q}</span><textarea className={cls} rows={4} value={str(data,`q${i+1}`)} onChange={e=>update(`q${i+1}`,e.target.value)} /></label>)}</div>}
    <div className="flex flex-wrap items-center gap-3"><button onClick={saveClose} className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-fg">Save & close</button><button onClick={markComplete} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Mark complete <ArrowRight /></button><span className="text-sm text-fg-subtle">{message}</span></div>
  </div>;
}
