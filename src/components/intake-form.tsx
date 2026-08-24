"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { ArrowRight } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40";
const labelCls = "mb-1.5 block text-sm font-medium text-fg-muted";
const fieldsetCls = "rounded-2xl border border-line bg-surface/40 p-5 sm:p-6";

const plans = ["One-Pager", "Essential", "Professional", "Online Store", "Custom / Scale", "Not sure yet"];
const domainModes = ["Register a new domain for me", "I already own a domain", "Not sure yet"];
const photoModes = ["I have photos/logo ready", "Use curated stock photos", "Use generated imagery", "Mix of these"];

function value(data: FormData, key: string) {
  return String(data.get(key) || "").trim();
}

export function IntakeForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const contactName = value(data, "contactName");
    const businessName = value(data, "businessName");

    const body = [
      "DIGITAL BUILDERS WEBSITE INTAKE",
      "",
      "Plan",
      `Selected plan: ${value(data, "plan")}`,
      `Coupon/source code: ${value(data, "sourceCode") || "None provided"}`,
      "",
      "Contact",
      `Name: ${contactName}`,
      `Email: ${value(data, "email")}`,
      `Phone: ${value(data, "phone")}`,
      "",
      "Business details",
      `Business name: ${businessName}`,
      `Trade/services: ${value(data, "services")}`,
      `Service areas: ${value(data, "serviceAreas")}`,
      `Address or service-area only: ${value(data, "address")}`,
      `Licences/certifications/WCB/insurance: ${value(data, "credentials")}`,
      `Social / Google Business links: ${value(data, "links")}`,
      "",
      "Domain",
      `Domain choice: ${value(data, "domainMode")}`,
      `Current or preferred domain names: ${value(data, "domains")}`,
      `Do you receive email at this domain?: ${value(data, "domainEmail")}`,
      "",
      "Photos and branding",
      `Photo preference: ${value(data, "photoMode")}`,
      `Logo/brand colours/photo notes: ${value(data, "brandNotes")}`,
      "",
      "Hours",
      `Hours and emergency/by-appointment notes: ${value(data, "hours")}`,
      "",
      "Guided content",
      `What should people call you for first?: ${value(data, "primaryCall")}`,
      `Why do customers choose you?: ${value(data, "whyChoose")}`,
      `Guarantees/warranties/financing?: ${value(data, "guarantees")}`,
      `Anything to say in your own words?: ${value(data, "voice")}`,
      "",
      "Timing",
      `Ideal launch timing: ${value(data, "timing")}`,
    ].join("\n");

    const subject = encodeURIComponent(
      `Website intake${businessName ? ` — ${businessName}` : contactName ? ` — ${contactName}` : ""}`,
    );
    window.location.href = `mailto:${site.inquiriesEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className={fieldsetCls}>
        <legend className="font-display text-lg font-semibold text-fg">1. Choose the build</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="plan" className={labelCls}>
              Website option
            </label>
            <select id="plan" name="plan" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Select a plan
              </option>
              {plans.map((plan) => (
                <option key={plan}>{plan}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sourceCode" className={labelCls}>
              Code, referral, or source link if you have one
            </label>
            <input id="sourceCode" name="sourceCode" placeholder="Optional" className={inputCls} />
          </div>
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className="font-display text-lg font-semibold text-fg">2. Contact and business details</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className={labelCls}>
              Your name
            </label>
            <input id="contactName" name="contactName" required placeholder="Jane Contractor" className={inputCls} />
          </div>
          <div>
            <label htmlFor="businessName" className={labelCls}>
              Business name
            </label>
            <input id="businessName" name="businessName" required placeholder="Acme Exteriors" className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email
            </label>
            <input id="email" name="email" type="email" required placeholder="you@company.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>
              Phone
            </label>
            <input id="phone" name="phone" required placeholder="Best number to call" className={inputCls} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="services" className={labelCls}>
              What do you do?
            </label>
            <textarea id="services" name="services" required rows={4} placeholder="Services, specialties, common jobs…" className={inputCls} />
          </div>
          <div>
            <label htmlFor="serviceAreas" className={labelCls}>
              Areas you serve
            </label>
            <textarea id="serviceAreas" name="serviceAreas" required rows={4} placeholder="Calgary, Airdrie, Okotoks…" className={inputCls} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="address" className={labelCls}>
              Address or service-area only
            </label>
            <input id="address" name="address" placeholder="Public address, or say service-area only" className={inputCls} />
          </div>
          <div>
            <label htmlFor="credentials" className={labelCls}>
              Licences, WCB, insurance, certifications
            </label>
            <input id="credentials" name="credentials" placeholder="Optional but useful for trust" className={inputCls} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="links" className={labelCls}>
            Existing links
          </label>
          <input id="links" name="links" placeholder="Google Business Profile, Facebook, Instagram, current website…" className={inputCls} />
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className="font-display text-lg font-semibold text-fg">3. Domain, photos, and hours</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="domainMode" className={labelCls}>
              Domain name
            </label>
            <select id="domainMode" name="domainMode" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Select one
              </option>
              {domainModes.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="domains" className={labelCls}>
              Current domain or ideas
            </label>
            <input id="domains" name="domains" placeholder="example.ca, acmeexteriors.ca…" className={inputCls} />
          </div>
          <div>
            <label htmlFor="domainEmail" className={labelCls}>
              Do you receive email at that domain?
            </label>
            <input id="domainEmail" name="domainEmail" placeholder="Yes / no / not sure" className={inputCls} />
          </div>
          <div>
            <label htmlFor="photoMode" className={labelCls}>
              Photos and logo
            </label>
            <select id="photoMode" name="photoMode" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Select one
              </option>
              {photoModes.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="brandNotes" className={labelCls}>
              Brand/photo notes
            </label>
            <textarea id="brandNotes" name="brandNotes" rows={4} placeholder="Logo availability, colours, photo ideas…" className={inputCls} />
          </div>
          <div>
            <label htmlFor="hours" className={labelCls}>
              Hours of operation
            </label>
            <textarea id="hours" name="hours" rows={4} placeholder="Open/closed days, emergency hours, seasonal notes…" className={inputCls} />
          </div>
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className="font-display text-lg font-semibold text-fg">4. Guided content</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="primaryCall" className={labelCls}>
              What should someone call you for first?
            </label>
            <textarea id="primaryCall" name="primaryCall" required rows={4} className={inputCls} />
          </div>
          <div>
            <label htmlFor="whyChoose" className={labelCls}>
              Why do customers choose you?
            </label>
            <textarea id="whyChoose" name="whyChoose" required rows={4} className={inputCls} />
          </div>
          <div>
            <label htmlFor="guarantees" className={labelCls}>
              Guarantees, warranties, or financing
            </label>
            <textarea id="guarantees" name="guarantees" rows={4} placeholder="Optional" className={inputCls} />
          </div>
          <div>
            <label htmlFor="voice" className={labelCls}>
              Anything you want said in your own words?
            </label>
            <textarea id="voice" name="voice" rows={4} placeholder="Optional" className={inputCls} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="timing" className={labelCls}>
            Ideal timing
          </label>
          <input id="timing" name="timing" placeholder="ASAP, this month, before a campaign date…" className={inputCls} />
        </div>
      </fieldset>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:bg-accent-soft hover:shadow-[0_12px_40px_-12px_rgba(29,78,216,0.7)] sm:w-auto"
      >
        Send intake
        <ArrowRight />
      </button>

      {sent && (
        <p className="text-sm text-accent-soft">
          Your email app should have opened with the intake ready to send. If it did not, email us at{" "}
          <a className="underline" href={`mailto:${site.inquiriesEmail}`}>
            {site.inquiriesEmail}
          </a>
          .
        </p>
      )}
    </form>
  );
}
