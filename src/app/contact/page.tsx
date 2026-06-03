import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";
import { Faq } from "@/components/faq";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Digital Builders. Questions, ideas, or collaborations — we offer guidance, support, and creative solutions tailored to your goals.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Let's talk"
        title={
          <>
            Get in touch with <span className="text-gradient">Digital Builders</span>.
          </>
        }
        intro="Whether it's a question, an idea, or a collaboration, our team offers guidance, support, and creative solutions tailored to your goals."
      />

      <Section className="pt-4">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Form */}
          <div className="card p-7 sm:p-9">
            <h2 className="font-display text-2xl font-semibold text-fg">Say hello!</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Fill in a few details and we&apos;ll get back to you shortly.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div className="card p-7">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                For enquiries
              </h3>
              <div className="mt-4 space-y-2 text-sm">
                <a
                  href={`mailto:${site.email}`}
                  className="block text-fg transition-colors hover:text-accent-soft"
                >
                  {site.email}
                </a>
                <a
                  href={`mailto:${site.inquiriesEmail}`}
                  className="block text-fg transition-colors hover:text-accent-soft"
                >
                  {site.inquiriesEmail}
                </a>
              </div>
            </div>

            <div className="card p-7">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                Phone
              </h3>
              <div className="mt-4 space-y-2 text-sm">
                {site.contacts.map((c) => (
                  <a
                    key={c.phone}
                    href={c.phoneHref}
                    className="block text-fg transition-colors hover:text-accent-soft"
                  >
                    {c.phone} <span className="text-fg-subtle">· {c.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="card p-7">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                Location
              </h3>
              <p className="mt-4 text-sm text-fg">
                {site.address.line}
                <br />
                {site.address.city}
              </p>
              <a
                href={site.address.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-accent-soft underline-offset-4 hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>

            <div className="card p-7">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                Socials
              </h3>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-fg transition-colors hover:text-accent-soft"
              >
                LinkedIn →
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-line">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered."
          intro="Curious about working with us? Here are answers that make our process clear and simple."
          align="center"
        />
        <div className="mx-auto max-w-3xl">
          <Faq />
        </div>
      </Section>
    </>
  );
}
