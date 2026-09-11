"use client";

import { useState } from "react";

async function post(path: string, body?: unknown) {
  const response = await fetch(path, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function VoiceLifecycleControls({ status, defaultPhone }: { status: string; defaultPhone: string }) {
  const phone = defaultPhone;
  const [notes, setNotes] = useState("");
  const [cancelText, setCancelText] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const run = async (name: string, action: () => Promise<{ message?: string }>) => {
    setBusy(name); setMessage("");
    try { const result = await action(); setMessage(result.message || "Done."); setTimeout(() => window.location.reload(), 900); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); }
    finally { setBusy(""); }
  };
  if (!["building", "test_call", "revising", "live", "cancellation_pending", "cancelled"].includes(status)) return null;
  return <section className="card" style={{ marginTop: 18 }}>
    <h2>{status === "cancelled" ? "Your retained records" : "Test, revise, and approve"}</h2>
    {["building", "test_call", "revising"].includes(status) && <>
      <label>Test-call number<input value={phone} readOnly inputMode="tel" /></label>
      <p className="micro">For safety, test calls can only go to a number saved on your account or intake.</p>
      <button disabled={Boolean(busy)} onClick={() => run("test", () => post("/api/portal/voice/test-call", { destination: phone, idempotency_key: crypto.randomUUID() }))}>{busy === "test" ? "Calling…" : "Place test call"}</button>
      <label>Changes after your test<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Tell us exactly what should sound or behave differently." /></label>
      <button className="secondary" disabled={Boolean(busy) || notes.trim().length < 10} onClick={() => run("revision", () => post("/api/portal/voice/revision", { notes }))}>{busy === "revision" ? "Sending…" : "Request changes"}</button>
      <div className="soft" style={{ marginTop: 14 }}><strong>Happy with the test?</strong><p>Approval activates inbound routing and starts recurring billing. No recurring subscription is created before you approve.</p><button disabled={Boolean(busy) || status === "building"} onClick={() => run("approve", () => post("/api/portal/voice/approve"))}>{busy === "approve" ? "Going live…" : "Approve and go live"}</button></div>
    </>}
    {["live", "cancellation_pending", "cancelled"].includes(status) && <div className="soft" style={{ marginTop: 14 }}>
      <strong>{status === "cancelled" ? "Record retention and export" : "Subscription and number"}</strong>
      {status === "cancelled"
        ? <p>Your intake and call records are retained for export and support. They are not automatically deleted after cancellation. A deletion request must be reviewed and approved in the CRM before any data is removed.</p>
        : <p>You can export your data at any time. Cancellation takes effect at the end of the paid period; your number is not released early. After cancellation, records remain available for export and support pending any reviewed and approved deletion request. Contact us before cancelling if you want to port the number.</p>}
      <a className="button secondary" href="/api/portal/voice/export">Download my data</a>
      {status === "live" && <><label>Type CANCEL to schedule cancellation<input value={cancelText} onChange={(event) => setCancelText(event.target.value)} /></label><button className="secondary" disabled={Boolean(busy) || cancelText !== "CANCEL"} onClick={() => run("cancel", () => post("/api/portal/voice/cancel"))}>{busy === "cancel" ? "Scheduling…" : "Cancel at period end"}</button></>}
    </div>}
    {message && <p role="status" className="micro" style={{ marginTop: 12 }}>{message}</p>}
  </section>;
}
