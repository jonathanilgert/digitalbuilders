import Link from "next/link";
import { nav, site } from "@/lib/content";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-navy">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
              {site.tagline}
            </p>
            <p className="mt-4 text-sm text-fg-subtle">
              {site.address.line}, {site.address.city}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fg-muted transition-colors hover:text-accent-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
              Get in touch
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-fg-muted transition-colors hover:text-accent-soft"
                >
                  {site.email}
                </a>
              </li>
              {site.contacts.map((c) => (
                <li key={c.phone}>
                  <a
                    href={c.phoneHref}
                    className="text-fg-muted transition-colors hover:text-accent-soft"
                  >
                    {c.phone}{" "}
                    <span className="text-fg-subtle">· {c.name}</span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fg-muted transition-colors hover:text-accent-soft"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-fg-subtle sm:flex-row">
          <p>
            © {site.founded}–2026 {site.legalName}. All rights reserved.
          </p>
          <p>Designed &amp; built in Calgary, AB.</p>
        </div>
      </div>
    </footer>
  );
}
