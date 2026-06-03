"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { ArrowRight } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const projectType = String(data.get("projectType") || "");
    const message = String(data.get("message") || "");

    const subject = encodeURIComponent(`New enquiry from ${name || "website"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\n${message}`,
    );
    // No backend yet — open the visitor's mail client pre-filled to our inbox.
    window.location.href = `mailto:${site.inquiriesEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-fg-muted">
            Name
          </label>
          <input id="name" name="name" required placeholder="Your name" className={inputCls} />
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
          rows={5}
          placeholder="A few lines about your business, goals, and timeline…"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:bg-accent-soft hover:shadow-[0_12px_40px_-12px_rgba(29,78,216,0.7)] sm:w-auto"
      >
        Send message
        <ArrowRight />
      </button>

      {sent && (
        <p className="text-sm text-accent-soft">
          Your email app should have opened with the message ready to send. If it didn&apos;t,
          email us directly at{" "}
          <a className="underline" href={`mailto:${site.inquiriesEmail}`}>
            {site.inquiriesEmail}
          </a>
          .
        </p>
      )}
    </form>
  );
}
