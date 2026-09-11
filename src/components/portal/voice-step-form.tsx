"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "@/components/ui";
import { HoursGrid, businessDays } from "@/components/portal/hours-grid";
import { VoicePicker } from "@/components/portal/voice-picker";
import { VoiceRecorder } from "@/components/portal/voice-recorder";

const field = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle";
const label = "mb-1.5 block text-sm font-medium text-fg-muted";
const carriers = ["Telus", "Bell", "Rogers", "Shaw", "Fido", "Koodo", "Virgin", "RingCentral", "Other", "Not sure"];
const routingModes = [
  ["new_number_only", "Use the new number on ads and your website. Your current line is untouched."],
  ["forward_after_hours", "Your current number rings through to us only outside your open hours."],
  ["forward_no_answer", "Your phone rings first. If nobody picks up in about four rings, we answer."],
  ["forward_all", "Everything comes to us first."],
] as const;
const jobs = [["message", "Take a message and ask the right questions"], ["message_book", "Take a message and book the appointment"], ["faq_message", "Answer common questions and take a message"], ["faq_book", "Answer questions and book the appointment"]] as const;

function text(data: Record<string, unknown>, key: string, fallback = "") { return String(data[key] ?? fallback); }
function transferTargetText(data: Record<string, unknown>) {
  if (data.transfer_targets_text !== undefined) return text(data, "transfer_targets_text");
  if (!Array.isArray(data.transfer_targets)) return "";
  return data.transfer_targets.map((target) => {
    const item = target && typeof target === "object" ? target as { number?: unknown; hours?: unknown } : {};
    return `${String(item.number || "")}${item.hours ? ` | ${String(item.hours)}` : ""}`;
  }).join("\n");
}
function defaults(number: number, businessName: string, plan: string) {
  const weekdayHours = Object.fromEntries(businessDays.flatMap((day) => day === "Saturday" || day === "Sunday" ? [[`${day}_open`, ""], [`${day}_close`, ""], [`${day}_closed`, true]] : [[`${day}_open`, "8:00 AM"], [`${day}_close`, "5:00 PM"], [`${day}_closed`, false]]));
  return ({
    1: { routing_mode: "forward_no_answer", carrier: "Not sure", rings_before_forward: 4 },
    2: { ...weekdayHours, coverage: plan === "voice_afterhours" ? "after_hours_only" : "overflow_and_after_hours", holidays: true, has_emergencies: false },
    3: { primary_job: "message", transfer_rules: "never", never_quote: true, never_arrival_promise: true, never_legal_insurance: true, qualifying_questions: "What is the service address?\nWhat happened and when did it start?" },
    4: { pricing_policy: "never_quote", financing_offered: false },
    5: { delivery: "immediate" },
    6: { agent_name: "Alex", voice_id: "warm_clear", greeting: `Thanks for calling ${businessName}, this is Alex — how can I help?`, tone: 50, recording_notice: true, ai_disclosure_acknowledged: false },
  } as Record<number, Record<string, unknown>>)[number] || {};
}

export function VoiceStepForm({ number, initial, state, businessName, plan }: { number: number; initial: Record<string, unknown>; state: string; businessName: string; plan: string }) {
  const initialData = useMemo(() => ({ ...defaults(number, businessName, plan), ...initial }), [number, initial, businessName, plan]);
  const [data, setData] = useState(initialData);
  const [saveState, setSaveState] = useState(state);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<Response>>(Promise.resolve(new Response()));
  const first = useRef(true);
  const transferRuleTouched = useRef(false);
  const payload = useMemo(() => JSON.stringify({ data, state: saveState === "complete" ? "complete" : "draft" }), [data, saveState]);

  function request(body: string) {
    const run = () => fetch(`/api/portal/voice/step/${number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
    queue.current = queue.current.catch(() => new Response()).then(run);
    return queue.current;
  }
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void request(payload).then((response) => setMessage(response.ok ? "Saved" : "Could not autosave")).catch(() => setMessage("Could not autosave")); }, 800);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // request deliberately uses the current step endpoint; payload changes serialize through queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);
  useEffect(() => {
    if (number !== 3 || initial.transfer_rules !== undefined) return;
    let active = true;
    void fetch("/api/portal/voice/step/2", { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((result: { data?: { has_emergencies?: unknown } } | null) => {
        if (active && !transferRuleTouched.current && result?.data?.has_emergencies === true) update("transfer_rules", "emergencies_only");
      }).catch(() => undefined);
    return () => { active = false; };
    // Existing step data always wins; this only supplies the conditional default.
  }, [number, initial.transfer_rules]);
  function update(key: string, value: unknown) { setData((current) => ({ ...current, [key]: value })); setMessage(""); }
  async function save(nextState: "draft" | "complete") {
    if (saving) return;
    if (timer.current) clearTimeout(timer.current);
    setSaving(true);
    setMessage("Saving…");
    try {
      const response = await request(JSON.stringify({ data, state: nextState }));
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) { setMessage(result.error || "Could not save."); return; }
      setSaveState(nextState); window.location.href = "/portal/voice/dashboard";
    } catch { setMessage("Could not save."); }
    finally { setSaving(false); }
  }
  const booking = text(data, "primary_job", "message").includes("book");
  const memoUploaded = (key: string) => (result: { id: string; transcript?: string }) => setData((current) => ({ ...current, [key]: result.id, ...(result.transcript && key === "voice_memo_id" ? { business_overview: result.transcript } : {}) }));

  return <div className="space-y-6">
    {Boolean(data.prefilled_from_website) && <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-fg-muted">From your website intake — change if it’s different.</div>}

    {number === 1 && <div className="space-y-5">
      <fieldset><legend className={label}>How should calls reach the agent?</legend><div className="grid gap-3 sm:grid-cols-2">{routingModes.map(([id, description]) => <label key={id} className={`cursor-pointer rounded-2xl border p-4 ${text(data, "routing_mode") === id ? "border-accent bg-accent/10" : "border-line bg-surface/30"}`}><span className="flex gap-3"><input type="radio" checked={text(data, "routing_mode") === id} onChange={() => update("routing_mode", id)} /><span className="text-sm leading-relaxed text-fg-muted">{description}{id === "forward_no_answer" && <strong className="mt-1 block text-accent-soft">Recommended</strong>}</span></span></label>)}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-3"><label><span className={label}>Current business number</span><input className={field} value={text(data, "existing_number")} onChange={(e) => update("existing_number", e.target.value)} placeholder="(403) 555-0123" /></label><label><span className={label}>Carrier</span><select className={field} value={text(data, "carrier")} onChange={(e) => update("carrier", e.target.value)}>{carriers.map((carrier) => <option key={carrier}>{carrier}</option>)}</select></label><label><span className={label}>Rings before we answer</span><input className={field} type="number" min="1" max="10" value={text(data, "rings_before_forward")} onChange={(e) => update("rings_before_forward", e.target.value)} /></label></div>
      <p className="text-sm text-fg-muted">Do not set up forwarding yet. After you approve the test call, we will provide exact carrier dial codes and can do it together in five minutes.</p>
    </div>}

    {number === 2 && <div className="space-y-5">
      <HoursGrid data={data} onChange={update} allowClosedToggle />
      <label><span className={label}>When should the agent cover calls?</span><select className={field} value={text(data, "coverage")} onChange={(e) => update("coverage", e.target.value)}><option value="24_7">24/7</option><option value="after_hours_only">After hours only</option><option value="overflow_only">Only when I do not answer</option><option value="overflow_and_after_hours">Overflow and after hours</option></select></label>
      <div className="flex flex-wrap gap-6"><label className="text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.holidays)} onChange={(e) => update("holidays", e.target.checked)} /> Cover holidays</label><label className="text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.has_emergencies)} onChange={(e) => update("has_emergencies", e.target.checked)} /> We handle emergencies</label></div>
      {Boolean(data.has_emergencies) && <label><span className={label}>What counts as an emergency worth waking you up for?</span><textarea className={field} rows={3} value={text(data, "emergency_definition")} onChange={(e) => update("emergency_definition", e.target.value)} /></label>}
      <details className="rounded-2xl border border-line bg-surface/30 p-4"><summary className="cursor-pointer text-sm font-medium text-fg">A few optional extras</summary><textarea className={`${field} mt-4`} rows={3} value={text(data, "seasonal_note")} onChange={(e) => update("seasonal_note", e.target.value)} placeholder="Seasonal or holiday notes" /></details>
    </div>}

    {number === 3 && <div className="space-y-5">
      <fieldset><legend className={label}>What is its primary job?</legend><div className="grid gap-2">{jobs.map(([id, name]) => <label key={id} className="rounded-xl border border-line p-3 text-sm text-fg-muted"><input className="mr-2" type="radio" checked={text(data, "primary_job") === id} onChange={() => update("primary_job", id)} />{name}</label>)}</div></fieldset>
      {booking && <div className="rounded-2xl border border-line p-4"><p className="mb-3 text-sm text-fg-muted">Calendar integration never holds up launch; until connected, the agent takes a structured message for confirmation.</p><div className="grid gap-3 sm:grid-cols-2"><select className={field} value={text(data, "calendar_type", "none")} onChange={(e) => update("calendar_type", e.target.value)}><option value="none">None yet — take messages</option><option>Google</option><option>Outlook</option><option>Jobber</option><option>Housecall Pro</option><option>Calendly</option></select><input className={field} value={text(data, "appointment_length")} onChange={(e) => update("appointment_length", e.target.value)} placeholder="Appointment length" /><input className={field} value={text(data, "buffer")} onChange={(e) => update("buffer", e.target.value)} placeholder="Buffer between bookings" /><input className={field} value={text(data, "book_out_days")} onChange={(e) => update("book_out_days", e.target.value)} placeholder="How many days ahead?" /><input className={field} value={text(data, "bookable_services")} onChange={(e) => update("bookable_services", e.target.value)} placeholder="Bookable services, comma separated" /><input className={field} value={text(data, "assign_to")} onChange={(e) => update("assign_to", e.target.value)} placeholder="Assign appointments to" /></div></div>}
      <label><span className={label}>Up to five qualifying questions</span><textarea className={field} rows={5} value={text(data, "qualifying_questions")} onChange={(e) => update("qualifying_questions", e.target.value.split("\n").slice(0, 5).join("\n"))} /><span className="mt-1 block text-xs text-fg-subtle">One per line. Five is about as many as someone will answer on the phone.</span></label>
      <label><span className={label}>When should a human get the call?</span><select className={field} value={text(data, "transfer_rules")} onChange={(e) => { transferRuleTouched.current = true; update("transfer_rules", e.target.value); }}><option value="never">Never transfer</option><option value="emergencies_only">Emergencies only</option><option value="if_caller_asks">If the caller asks</option><option value="always_try_first">Always try a human first</option></select></label>
      <label><span className={label}>Transfer targets (up to three, one per line)</span><textarea className={field} rows={3} value={transferTargetText(data)} onChange={(e) => { const raw = e.target.value.split("\n").slice(0, 3).join("\n"); update("transfer_targets_text", raw); update("transfer_targets", raw.split("\n").filter(Boolean).map((line) => { const [number, ...hours] = line.split("|"); return { number: number.trim(), ...(hours.join("|").trim() ? { hours: hours.join("|").trim() } : {}) }; })); }} placeholder={"403-555-0123 | weekdays 8–5\n587-555-0199 | evenings"} /><span className="mt-1 block text-xs text-fg-subtle">Put reachable hours after a | character. Numbers are tried in this order.</span></label>
      <fieldset><legend className={label}>The agent must never</legend><div className="grid gap-2 text-sm text-fg-muted">{[["never_quote", "Quote a price"], ["never_arrival_promise", "Promise a specific arrival date or time"], ["never_legal_insurance", "Answer warranty, legal, or insurance-coverage questions"], ["never_competitors", "Discuss competitors"]].map(([key, copy]) => <label key={key}><input type="checkbox" checked={Boolean(data[key])} onChange={(e) => update(key, e.target.checked)} /> {copy}</label>)}</div></fieldset>
      <details className="rounded-2xl border border-line bg-surface/30 p-4"><summary className="cursor-pointer text-sm font-medium text-fg">A few optional extras</summary><textarea className={`${field} mt-4`} value={text(data, "never_do_other")} onChange={(e) => update("never_do_other", e.target.value)} placeholder="Anything else it should stay away from?" /></details>
    </div>}

    {number === 4 && <div className="space-y-5">
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5"><p className="font-medium text-fg">Rather just talk?</p><p className="mt-1 mb-3 text-sm text-fg-muted">Record a minute about what you do and we’ll write it up.</p><VoiceRecorder step={4} label="One-minute business overview" onUploaded={memoUploaded("voice_memo_id")} /><label><span className={`${label} mt-4`}>Editable transcript / business overview</span><textarea className={field} rows={5} value={text(data, "business_overview")} onChange={(e) => update("business_overview", e.target.value)} placeholder="Your transcript appears here; you can also type it." /></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label><span className={label}>Services offered</span><textarea className={field} rows={4} value={text(data, "services")} onChange={(e) => update("services", e.target.value)} placeholder="Separate with commas" /></label><label><span className={label}>What do people call about that you don’t actually do?</span><textarea className={field} rows={4} value={text(data, "services_not_offered")} onChange={(e) => update("services_not_offered", e.target.value)} /></label><label><span className={label}>Service area</span><textarea className={field} rows={3} value={text(data, "service_area")} onChange={(e) => update("service_area", e.target.value)} placeholder="Cities or neighbourhoods" /></label><label><span className={label}>Travel limit</span><input className={field} value={text(data, "travel_limit")} onChange={(e) => update("travel_limit", e.target.value)} /></label></div>
      <label><span className={label}>Pricing policy</span><select className={field} value={text(data, "pricing_policy")} onChange={(e) => update("pricing_policy", e.target.value)}><option value="never_quote">Never quote prices</option><option value="starting_at_range">Give a starting price or range</option><option value="free_estimate">Offer a free estimate</option></select></label>
      {text(data, "pricing_policy") !== "never_quote" && <input className={field} value={text(data, "pricing_wording")} onChange={(e) => update("pricing_wording", e.target.value)} placeholder="Exact range or free-estimate wording" />}
      <details className="rounded-2xl border border-line bg-surface/30 p-4"><summary className="cursor-pointer text-sm font-medium text-fg">A few optional extras</summary><div className="mt-4 grid gap-4"><input className={field} value={text(data, "payment_methods")} onChange={(e) => update("payment_methods", e.target.value)} placeholder="Payment methods" /><label className="text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.financing_offered)} onChange={(e) => update("financing_offered", e.target.checked)} /> Financing offered</label><div className="grid gap-3 sm:grid-cols-2">{["licence", "insurance", "wcb", "warranty"].map((key) => <input key={key} className={field} value={text(data, key)} onChange={(e) => update(key, e.target.value)} placeholder={key.toUpperCase()} />)}</div><textarea className={field} rows={6} value={text(data, "faqs")} onChange={(e) => update("faqs", e.target.value)} placeholder="Up to five common questions and answers" /><VoiceRecorder step={4} label="Upload or record your existing voicemail greeting" onUploaded={memoUploaded("voicemail_greeting_upload")} /></div></details>
    </div>}

    {number === 5 && <div className="space-y-5">
      <p className="text-sm text-fg-muted">Add up to three destinations, separated by commas. A phone number or email is the only required answer in this step.</p>
      <div className="grid gap-4 sm:grid-cols-2"><label><span className={label}>Text leads to</span><input className={field} value={Array.isArray(data.sms_to) ? data.sms_to.join(", ") : text(data, "sms_to")} onChange={(e) => update("sms_to", e.target.value.split(",").slice(0, 3).join(","))} /></label><label><span className={label}>Email leads to</span><input className={field} value={Array.isArray(data.email_to) ? data.email_to.join(", ") : text(data, "email_to")} onChange={(e) => update("email_to", e.target.value.split(",").slice(0, 3).join(","))} /></label></div>
      <label><span className={label}>Delivery timing</span><select className={field} value={text(data, "delivery")} onChange={(e) => update("delivery", e.target.value)}><option value="immediate">Immediately</option><option value="daily_digest">Daily digest</option><option value="both">Both</option></select></label>
      <div className="grid gap-4 sm:grid-cols-2"><label><span className={label}>Failure fallback number</span><input className={field} value={text(data, "fallback_number")} onChange={(e) => update("fallback_number", e.target.value)} /><span className="mt-1 block text-xs text-fg-subtle">If anything goes wrong on our end, callers land back on your regular phone.</span></label><label><span className={label}>Account owner</span><input className={field} value={text(data, "account_owner")} onChange={(e) => update("account_owner", e.target.value)} /></label></div>
      <details className="rounded-2xl border border-line bg-surface/30 p-4"><summary className="cursor-pointer text-sm font-medium text-fg">A few optional extras</summary><input className={`${field} mt-4`} type="url" value={text(data, "crm_webhook")} onChange={(e) => update("crm_webhook", e.target.value)} placeholder="CRM webhook URL" /></details>
    </div>}

    {number === 6 && <div className="space-y-5">
      <label><span className={label}>Agent name</span><input className={field} value={text(data, "agent_name")} onChange={(e) => { update("agent_name", e.target.value); }} /></label>
      <VoicePicker value={text(data, "voice_id")} greeting={text(data, "greeting")} onChange={(id) => update("voice_id", id)} />
      <label><span className={label}>Greeting</span><textarea className={field} rows={3} value={text(data, "greeting")} onChange={(e) => update("greeting", e.target.value)} /></label>
      <details className="rounded-2xl border border-line bg-surface/30 p-4"><summary className="cursor-pointer text-sm font-medium text-fg">A few optional extras — business-name pronunciation</summary><div className="mt-4 space-y-4"><label><span className={label}>Write it how it sounds</span><input className={field} value={text(data, "name_pronunciation")} onChange={(e) => update("name_pronunciation", e.target.value)} placeholder="Example: MY-koh" /><span className="mt-1 block text-xs text-fg-subtle">Say your business name once so we get it right — this is the thing people notice most.</span></label><VoiceRecorder step={6} maxSeconds={10} label="Optional 10-second pronunciation recording" onUploaded={memoUploaded("pronunciation_memo_id")} /></div></details>
      <label><span className={label}>Tone: warm/casual ↔ professional/formal</span><input className="w-full accent-[var(--accent)]" type="range" min="0" max="100" value={text(data, "tone")} onChange={(e) => update("tone", e.target.value)} /></label>
      <label className="block text-sm text-fg-muted"><input type="checkbox" checked={Boolean(data.recording_notice)} onChange={(e) => update("recording_notice", e.target.checked)} /> Tell callers the call may be recorded (recommended and on by default)</label>
      <div className="rounded-2xl border border-line bg-surface/30 p-4 text-sm leading-relaxed text-fg-muted"><p>If a caller asks whether they’re talking to a person, your agent will always tell them it’s an AI assistant and offer to take a message or pass them to you. This isn’t optional — it’s how we keep your callers’ trust, and yours.</p><label className="mt-3 block"><input type="checkbox" checked={Boolean(data.ai_disclosure_acknowledged)} onChange={(e) => update("ai_disclosure_acknowledged", e.target.checked)} /> I understand</label></div>
    </div>}

    <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving} onClick={() => void save("draft")} className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-fg disabled:opacity-50">Save & close</button><button type="button" disabled={saving} onClick={() => void save("complete")} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink disabled:opacity-50">Mark complete <ArrowRight /></button><span className="text-sm text-fg-subtle" role="status">{message}</span></div>
  </div>;
}
