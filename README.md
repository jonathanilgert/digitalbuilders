# Digital Builders — Website

The new Digital Builders site, rebuilt from the Framer site (digitalbuilders.ca) as a
**Next.js 16 + React 19 + Tailwind v4** static app.

## Run locally

```bash
npm install      # first time only
npm run dev      # http://localhost:3000
```

## Build for production

```bash
npm run build    # outputs an optimized, fully static site
npm run start    # serve the production build locally
```

## Deploy

Every page is statically prerendered, so it deploys anywhere:

- **Vercel** (easiest): push to GitHub and import the repo — zero config.
- **Netlify / Cloudflare Pages**: build command `npm run build`.

Point the `digitalbuilders.ca` domain at the deployment when you're ready to go live.

## Editing content

Almost all copy lives in one file: **`src/lib/content.ts`** — company info, nav,
services, pricing, FAQ, projects, and contact details. Change text there and it
updates everywhere it's used.

## Structure

```
src/
  app/
    layout.tsx        # fonts, metadata, Navbar + Footer wrapper
    page.tsx          # Home (hero, about, services, process, work, pricing, VoiceAI, FAQ)
    about/page.tsx
    services/page.tsx
    work/page.tsx
    contact/page.tsx
    globals.css       # brand theme tokens (navy + amber) and base styles
  components/         # Navbar, Footer, UI primitives, icons, CTA, FAQ, contact form
  lib/content.ts      # ← all site copy and data
```

## Notes / next steps

- **Pricing** uses the dated `DigitalBuilders-Pricing-Plan.md` from August 2026
  (One-Pager $599, Essential $999, Professional $1,495, Online Store from $2,950,
  Custom from $5,000, Care Plan $49/mo or $490/year, Domain $19/year).
- **Portal backend** runs as a Next.js server (`output: "standalone"`) with payment-gated
  Stripe Checkout, magic links, autosaved six-step intake, local asset/package storage,
  preview/approve/revision flows, nudge endpoint, and password-protected admin.
- **Required production secrets** for the full paid flow: `DB_STRIPE_SECRET_KEY`,
  `DB_STRIPE_WEBHOOK_SECRET`, `DB_RESEND_API_KEY`, `DB_PORTAL_ADMIN_TOKEN`, and
  `DB_PORTAL_CRON_TOKEN`. Without Stripe keys, checkout returns a setup-required error
  and no client record is created.
- **Storage note:** v1 stores portal state and uploads under `PORTAL_DATA_DIR`. The docs
  still call for Postgres + R2/S3 as the durable production target before higher-volume use.
- **Portfolio** shows project name/type/year. Add images and individual case-study
  pages (`app/work/[slug]/page.tsx`) when assets are ready.
- The old DirtLink founding offer has been replaced by the standing coded Professional price in the August 2026 pricing plan.
