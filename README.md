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

- **Pricing** uses the updated numbers from `Digital_Builders_Pricing.pdf`
  (Starter $1,495, Online Store from $2,950, Custom from $5,000, Care Plan $49/mo).
- **Contact form** opens the visitor's email client (mailto) — no backend yet.
  Swap in Formspree, Resend, or a serverless route in `src/components/contact-form.tsx`
  when you want submissions delivered automatically.
- **Portfolio** shows project name/type/year. Add images and individual case-study
  pages (`app/work/[slug]/page.tsx`) when assets are ready.
- The DirtLink founding offer was intentionally left off the public site.
