"use client";

import { useEffect, useState } from "react";

const options = [
  { id: "warm_clear", name: "Warm & clear", detail: "Relaxed and welcoming", rate: 0.94, pitch: 1.04 },
  { id: "calm_professional", name: "Calm professional", detail: "Measured and polished", rate: 0.88, pitch: 0.94 },
  { id: "bright_friendly", name: "Bright & friendly", detail: "Upbeat and conversational", rate: 1.04, pitch: 1.12 },
  { id: "steady_confident", name: "Steady & confident", detail: "Direct and reassuring", rate: 0.96, pitch: 0.88 },
] as const;

export function VoicePicker({ value, greeting, onChange }: { value: string; greeting: string; onChange: (id: string) => void }) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => setSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window), 0);
    return () => { window.clearTimeout(timeout); window.speechSynthesis?.cancel(); };
  }, []);
  function play(option: typeof options[number]) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(greeting || "Thanks for calling. How can I help?");
    utterance.rate = option.rate; utterance.pitch = option.pitch;
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (voices.length) utterance.voice = voices[options.indexOf(option) % voices.length];
    utterance.onend = () => setPlaying(""); utterance.onerror = () => setPlaying("");
    setPlaying(option.id); window.speechSynthesis.speak(utterance);
  }
  return <fieldset><legend className="mb-2 text-sm font-medium text-fg-muted">Choose a voice</legend>
    <div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <label key={option.id} className={`rounded-2xl border p-4 ${value === option.id ? "border-accent bg-accent/10" : "border-line bg-surface/30"}`}>
      <span className="flex items-start gap-3"><input type="radio" name="voice" checked={value === option.id} onChange={() => onChange(option.id)} /><span className="flex-1"><strong className="block text-sm text-fg">{option.name}</strong><span className="text-xs text-fg-muted">{option.detail}</span></span>
      <button type="button" disabled={!supported} onClick={(event) => { event.preventDefault(); play(option); }} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg disabled:opacity-50">{playing === option.id ? "Playing…" : "▶ Preview"}</button></span>
    </label>)}</div>
    <p className="mt-2 text-xs text-fg-subtle">Previews use your browser’s built-in speech voices, so the exact sound can vary by device. We’ll match the style you choose during setup.</p>
  </fieldset>;
}
