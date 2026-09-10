"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { ArrowRight } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (!response.ok) throw new Error("Contact request failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-fg-muted">
            Name
          </label>
          <input id="name" name="name" required maxLength={120} placeholder="Your name" className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-fg-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            placeholder="you@company.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="projectType" className="mb-1.5 block text-sm font-medium text-fg-muted">
          What do you need?
        </label>
        <select id="projectType" name="projectType" className={inputCls} defaultValue="">
          <option value="" disabled>
            Select a project type
          </option>
          <option>Business website</option>
          <option>Online store / e-commerce</option>
          <option>Custom / scale project</option>
          <option>VoiceAI / automation</option>
          <option>Care plan & support</option>
          <option>Something else</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-fg-muted">
          Tell us about your project
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="A few lines about your business, goals, and timeline…"
          className={inputCls}
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:bg-accent-soft hover:shadow-[0_12px_40px_-12px_rgba(29,78,216,0.7)] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {status === "sending" ? "Sending…" : "Send message"}
        <ArrowRight />
      </button>

      <div aria-live="polite">
        {status === "sent" && (
          <p className="text-sm text-accent-soft">
            Thanks — your message has been sent. We&apos;ll get back to you shortly.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-300">
            We couldn&apos;t send your message just now. Please try again or email us at{" "}
            <a className="underline" href={`mailto:${site.inquiriesEmail}`}>
              {site.inquiriesEmail}
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
