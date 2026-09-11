"use client";

import { useEffect, useRef, useState } from "react";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const WEBM_MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
const APPLE_MIME_CANDIDATES = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac"];

/** Safari records MP4 most reliably; Chromium records Opus/WebM most reliably. */
export function recordingMimeCandidates(userAgent: string) {
  const appleMobile = /iP(?:hone|ad|od)/i.test(userAgent);
  const safari = /Safari/i.test(userAgent) && !/(?:Chrome|CriOS|Edg|OPR|Android)/i.test(userAgent);
  return appleMobile || safari ? [...APPLE_MIME_CANDIDATES, ...WEBM_MIME_CANDIDATES] : [...WEBM_MIME_CANDIDATES, ...APPLE_MIME_CANDIDATES];
}

function extensionForMime(mime: string) {
  const base = mime.split(";")[0].toLowerCase();
  return ({ "audio/webm": "webm", "audio/mp4": "m4a", "audio/aac": "aac", "audio/ogg": "ogg" } as Record<string, string>)[base] || "audio";
}

type UploadResult = { id: string; playbackUrl: string; transcript?: string; transcription: "complete" | "unavailable"; message?: string };

export function VoiceRecorder({ step, label, maxSeconds = 60, onUploaded }: { step: 4 | 6; label: string; maxSeconds?: number; onUploaded: (result: UploadResult) => void }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); stream.current?.getTracks().forEach((track) => track.stop()); if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function upload(blob: Blob, name: string, duration = seconds) {
    if (blob.size > MAX_UPLOAD_BYTES) { setMessage("Choose an audio file smaller than 25 MB."); return; }
    setUploading(true); setMessage("Uploading and transcribing…");
    try {
      const form = new FormData();
      // Appending the Blob directly supports older iOS versions where constructing
      // a File from a MediaRecorder Blob can fail.
      form.append("audio", blob, name);
      form.set("step", String(step)); form.set("duration_s", String(duration));
      const response = await fetch("/api/portal/voice/memo", { method: "POST", body: form });
      const result = await response.json() as UploadResult & { error?: string };
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setMessage(result.transcription === "complete" ? "Saved and transcribed." : (result.message || "Recording saved; transcription unavailable."));
      onUploaded(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); }
  }

  async function start() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setMessage("Recording is not available in this browser. Choose an audio file below instead."); return; }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = recordingMimeCandidates(navigator.userAgent).find((type) => MediaRecorder.isTypeSupported(type));
      let active: MediaRecorder;
      try { active = mimeType ? new MediaRecorder(media, { mimeType }) : new MediaRecorder(media); }
      catch { active = new MediaRecorder(media); }
      recorder.current = active; chunks.current = []; startedAt.current = Date.now(); setSeconds(0);
      active.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      active.onerror = () => setMessage("Recording stopped unexpectedly. You can retry or upload a file.");
      active.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        media.getTracks().forEach((track) => track.stop()); setRecording(false);
        const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        const blob = new Blob(chunks.current, { type: active.mimeType || "audio/mp4" });
        if (!blob.size) { setMessage("No audio was captured. Please retry."); return; }
        const url = URL.createObjectURL(blob); setPreview(url);
        void upload(blob, `voice-memo.${extensionForMime(active.mimeType)}`, duration);
      };
      // Some Safari releases reject a timeslice even though MediaRecorder works.
      try { active.start(250); } catch { active.start(); }
      setRecording(true);
      timer.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startedAt.current) / 1000); setSeconds(elapsed);
        if (elapsed >= maxSeconds && active.state === "recording") active.stop();
      }, 500);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setRecording(false);
      setMessage("Microphone access was not available. Allow access and retry, or choose an audio file below.");
    }
  }
  function stop() { if (recorder.current?.state === "recording") recorder.current.stop(); }
  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { setMessage("Choose an audio file smaller than 25 MB."); event.target.value = ""; return; }
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file)); void upload(file, file.name, 0);
  }

  return <div className="rounded-2xl border border-line bg-ink/30 p-4">
    <p className="text-sm font-medium text-fg">{label}</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {!recording ? <button type="button" disabled={uploading} onClick={start} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink">Record</button> : <button type="button" onClick={stop} className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">Stop ({seconds}s / {maxSeconds}s)</button>}
      <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-fg">Upload audio<input className="sr-only" type="file" accept="audio/*,.m4a,.mp4,.webm,.mp3,.wav,.ogg,.aac" onChange={choose} /></label>
      {preview && <audio className="h-10 max-w-full" controls src={preview}>Your browser cannot play this recording.</audio>}
    </div>
    <p className="mt-2 text-xs text-fg-subtle" role="status">{message || "Works with iPhone, iPad, and Android. An upload option is always available."}</p>
  </div>;
}
