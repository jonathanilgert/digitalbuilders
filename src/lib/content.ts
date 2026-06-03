// Central content for the Digital Builders site.
// Edit copy here — pages read from these objects so wording stays consistent.

export const site = {
  name: "Digital Builders",
  legalName: "Digital Builders®",
  tagline:
    "A digital studio crafting modern websites, online stores, and clean UX design.",
  description:
    "Digital Builders is a Calgary creative studio designing modern websites, online stores, and clean UX — built to feel intuitive, engaging, and ready to perform.",
  url: "https://digitalbuilders.ca",
  email: "hello@digitalbuilders.ca",
  inquiriesEmail: "contact@digitalbuilders.ca",
  bookingUrl: "https://cal.com/digital-builders-v7k9vc/quick-call",
  linkedin: "https://www.linkedin.com/company/110243692",
  founded: 2024,
  contacts: [
    { name: "Jonathan", phone: "+1 403 771 1597", phoneHref: "tel:+14037711597" },
  ],
  address: {
    line: "803 21 Ave SE",
    city: "Calgary, AB T2G 1M9",
    maps: "https://maps.google.com/?q=803+21+Ave+SE+Calgary+AB+T2G+1M9",
  },
};

export const nav = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" },
];

export const stats = [
  { value: "Since 2024", label: "Building on the web" },
  { value: "105+", label: "Projects delivered" },
  { value: "83%", label: "Client satisfaction rate" },
  { value: "17+", label: "Creative experts" },
];

export const features = [
  {
    title: "Seamless Design",
    body: "Interfaces that feel effortless — clean layouts, clear hierarchy, and motion used with purpose.",
  },
  {
    title: "Flexible Solutions",
    body: "From a single landing page to a full store, we shape the build around your goals and budget.",
  },
  {
    title: "Lasting Impact",
    body: "Sites built to perform — fast, accessible, and easy to grow long after launch.",
  },
  {
    title: "Creative Strategy",
    body: "Every decision ties back to your audience, your offer, and the action you want them to take.",
  },
  {
    title: "Dedicated Support",
    body: "A small, hands-on team that stays reachable before, during, and after your project ships.",
  },
];

export const services = [
  {
    title: "UI/UX Website Design",
    body: "Modern, clear, user-friendly design with quick turnarounds that keep your site sharp.",
    icon: "layout",
  },
  {
    title: "Custom Website Development",
    body: "Websites built from scratch — optimized for speed, structure, conversion, and scalability.",
    icon: "code",
  },
  {
    title: "Framer Development",
    body: "High-performance Framer sites with smooth animations, CMS support, and easy editing.",
    icon: "spark",
  },
  {
    title: "Webflow Development",
    body: "Scalable sites with a CMS, responsive layouts, and a visual editor your team can run without code.",
    icon: "grid",
  },
  {
    title: "Shopify E-commerce Stores",
    body: "Conversion-driven Shopify stores with clean product pages and simple checkout flows.",
    icon: "cart",
  },
  {
    title: "Mobile App Development",
    body: "From UI/UX to full build — app experiences that feel intuitive, fast, and ready to scale.",
    icon: "phone",
  },
];

export const process = [
  {
    step: "01",
    title: "Discover Insights",
    body: "We learn your business, audience, and goals to set a clear direction before any design begins.",
  },
  {
    step: "02",
    title: "Design Concepts",
    body: "We craft modern, on-brand concepts and map the user journey for every key page.",
  },
  {
    step: "03",
    title: "Refine Details",
    body: "We polish layout, copy, and interactions together with you until it's exactly right.",
  },
  {
    step: "04",
    title: "Deliver Results",
    body: "We launch, train you on editing, and stay on hand to keep things running smoothly.",
  },
];

export const pricing = [
  {
    name: "Starter Site",
    price: "$1,495",
    cadence: "one-time",
    tagline: "For local businesses, studios, cafés & wellness practices.",
    features: [
      "1–5 page website",
      "Modern, responsive UI/UX design",
      "Contact / booking form",
      "Basic SEO setup",
      "1 round of revisions",
      "Launch & training session",
      "Built in ~2 weeks",
    ],
    featured: false,
  },
  {
    name: "Online Store",
    price: "from $2,950",
    cadence: "one-time",
    tagline: "For selling products and taking bookings online.",
    features: [
      "Everything in Starter",
      "Product pages & collections",
      "Stripe or Shopify checkout",
      "Order tracking system",
      "Seller onboarding",
      "Growth & marketing advice",
    ],
    featured: true,
  },
  {
    name: "Custom / Scale",
    price: "from $5,000",
    cadence: "per project",
    tagline: "For scaling businesses that need more.",
    features: [
      "Discovery call + strategy session",
      "Custom UX/UI & full branding",
      "User journey planning & research",
      "Automations & custom features",
      "Booking / CRM / portal / dashboard",
      "SEO structure & content strategy",
      "2 rounds of revisions",
    ],
    featured: false,
  },
];

export const carePlan = {
  name: "Care Plan",
  price: "$49",
  cadence: "/month",
  tagline: "Keep your site fast, secure, and up to date — month-to-month, cancel anytime.",
  features: [
    "Hosting, SSL & security",
    "Automated backups",
    "Software updates",
    "Uptime monitoring",
    "Small content edits (~30 min/mo)",
  ],
};

export const voiceAI = [
  {
    title: "VoiceAI for Business Calls",
    body: "24/7 inbound call handling that answers, qualifies, and routes — so you never miss a customer, even after hours.",
  },
  {
    title: "Conversational AI for Customer Communication",
    body: "Smart chat, SMS, and messaging that replies instantly, books appointments, and keeps conversations moving.",
  },
];

export const faqs = [
  {
    q: "How much does a website cost?",
    a: "It depends on the size and complexity of the project, but most business websites start from $1,495 and online stores from $2,950. We always provide a clear estimate before any work begins.",
  },
  {
    q: "How long does it take to complete a website?",
    a: "A Starter site is typically live in about two weeks. Larger stores and custom builds take longer — we'll give you a realistic timeline up front.",
  },
  {
    q: "Do I need to provide all the content myself?",
    a: "Not necessarily. We're happy to work with the content you have, help shape your messaging, and guide you on images and copy where you need a hand.",
  },
  {
    q: "Can I edit the website after it's launched?",
    a: "Yes. We build on platforms that are easy to manage, and your launch includes a training session so you can confidently make updates yourself.",
  },
  {
    q: "Will my website be optimized for mobile and speed?",
    a: "Always. Every site we build is fully responsive and tuned for fast load times and strong performance across devices.",
  },
  {
    q: "Do you offer support after launch?",
    a: "Yes. Our $49/month Care Plan covers hosting, security, backups, updates, and small content edits — month-to-month, cancel anytime.",
  },
];

export type CaseStudyImage = { src: string; alt: string };
export type CaseFact = { label: string; value: string; href?: string };

export type CaseStudy = {
  facts: CaseFact[];
  overview: string;
  approachTitle?: string;
  approachIntro: string;
  approach: string[];
  implementation?: string;
  results: string;
  resultsList?: string[];
  quote?: string;
  images: CaseStudyImage[];
};

export type Project = {
  name: string;
  type: string;
  year: string;
  slug?: string;
  cover?: string;
  summary?: string;
  caseStudy?: CaseStudy;
};

export const projects: Project[] = [
  {
    name: "DirtLink",
    type: "Marketplace · Web App",
    year: "2026",
    slug: "dirtlink",
    cover: "/work/dirtlink/cover.png",
    summary:
      "A map-based marketplace that lets Calgary construction sites post and find earth material nearby — replacing text threads and spreadsheets with one regional map.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "Construction · Calgary, AB" },
        { label: "Timeline", value: "4 months" },
        { label: "Services", value: "Brand, UX/UI, Full-stack Build" },
        { label: "Live site", value: "dirtlink.ca", href: "https://dirtlink.ca" },
      ],
      overview:
        "DirtLink is a map-based network for construction sites that have or need earth material. In Calgary, contractors haul perfectly good fill to landfill while sites nearby need it — because nobody has a view across the region. DirtLink fixes that: drop a pin, list what's on the ground, and connect with operators nearby before the next truck rolls.",
      approachTitle: "Our approach",
      approachIntro:
        "We designed and built DirtLink end-to-end in four months — from brand and product strategy through a live, map-first web app. The whole experience is organized around a single regional map instead of scattered texts and spreadsheets.",
      approach: [
        "Map-based discovery — every site, pin and listing on one regional map",
        "Have / Need listings that match material between nearby sites",
        "Smart filters by material, quantity, radius, access & availability",
        "Direct messaging threaded to each site and listing",
        "Soils reports, geotech docs & site photos attached to listings",
        "Proximity alerts when a match appears in your working radius",
        "Claimed site ownership and verification",
      ],
      implementation:
        "Built for field use — fast enough for the truck dash and detailed enough for the project desk. Launched in Calgary as a free early-access beta: post and browse with no card required.",
      results: "Delivered in four months and live in Calgary:",
      resultsList: [
        "Launched as a free early-access beta — no card required",
        "Replaces the text-thread-and-spreadsheet loop with one map",
        "Built for every role — excavation, developers, operators, trucking, contractors & municipalities",
        "Targets the 30%+ of fill that goes to disposal while nearby sites need it",
      ],
      quote: "Earth material shouldn't be the thing that holds your schedule hostage.",
      images: [
        { src: "/work/dirtlink/cover.png", alt: "DirtLink landing — the nearest pile of dirt you need is probably 4 km away" },
        { src: "/work/dirtlink/app-map.png", alt: "DirtLink app — map of Calgary sites with material pins and filters" },
        { src: "/work/dirtlink/how-it-works.png", alt: "Four steps from pile to placement" },
        { src: "/work/dirtlink/audience.png", alt: "Every role along the dirt — who DirtLink is built for" },
        { src: "/work/dirtlink/messaging.png", alt: "Direct messaging threaded to a site and listing" },
        { src: "/work/dirtlink/notifications.png", alt: "Notification and proximity-alert settings" },
      ],
    },
  },
  {
    name: "Penned",
    type: "SaaS · Web App",
    year: "2026",
    slug: "penned",
    cover: "/work/penned/cover.png",
    summary:
      "A dead-simple e-signature web app — upload a PDF, drop signature fields, and get it signed in 30 seconds, with no bloat and no monthly fees.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "SaaS · E-signature" },
        { label: "Timeline", value: "1 month" },
        { label: "Services", value: "Brand, UX/UI, Full-stack Build" },
        { label: "Live site", value: "penned.ca", href: "https://penned.ca" },
      ],
      overview:
        "Penned is the simplest way to get a lease, bill of sale, or any document signed online. Where tools like DocuSign pile on bloat and monthly fees, Penned does one thing well: upload a PDF, place signature fields, and send — signed in about 30 seconds. Free for up to three documents a month, with no account needed to sign.",
      approachTitle: "Our approach",
      approachIntro:
        "We designed and built Penned end-to-end in a single month — brand, product, and a full e-signature web app — keeping the whole experience down to three friction-free steps.",
      approach: [
        "Upload any PDF or start from a template — leases, bills of sale, NDAs",
        "Point-and-click signature, initial, date & text fields",
        "Recipients sign from any device — no account, no app, no upsell",
        "Instant completed PDFs delivered to both parties",
        "Dashboard for documents, statuses, and saved templates",
        "Simple, transparent pricing — free, pay-as-you-go, or unlimited",
      ],
      implementation:
        "Legally binding and built to be boring on purpose: compliant with Canadian PIPEDA and U.S. ESIGN / UETA, encrypted at rest and in transit, and usable on any device with zero friction.",
      results: "Designed, built, and launched in one month:",
      resultsList: [
        "Documents signed in about 30 seconds, start to finish",
        "Free for up to 3 documents a month — no credit card required",
        "Pricing that undercuts DocuSign's $15/mo-for-5-docs by a mile",
        "Legally binding signatures (PIPEDA, ESIGN / UETA)",
      ],
      quote: "Boring on purpose. Reliable by design.",
      images: [
        { src: "/work/penned/cover.png", alt: "Penned landing — sign documents in 30 seconds" },
        { src: "/work/penned/dashboard.png", alt: "Penned dashboard — documents, usage and saved templates" },
        { src: "/work/penned/how-it-works.png", alt: "Three steps — upload, place fields, send" },
        { src: "/work/penned/pricing.png", alt: "Pricing — free, pay-as-you-go and unlimited plans" },
        { src: "/work/penned/billing.png", alt: "Billing and monthly plan usage" },
      ],
    },
  },
  {
    name: "Underground Foods",
    type: "Marketplace · Shopify",
    year: "2025",
    slug: "underground-foods",
    cover: "/work/underground-foods/cover.png",
    summary:
      "A community-driven Shopify marketplace connecting local makers and conscious buyers across Calgary.",
    caseStudy: {
      facts: [
        { label: "Location", value: "Ramsay & Inglewood, Calgary" },
        { label: "Platform", value: "Shopify" },
        { label: "Services", value: "Strategy, UX, Shopify Development" },
        { label: "Live site", value: "undergroundfoods.ca", href: "https://undergroundfoods.ca" },
      ],
      overview:
        "Underground Foods connects local makers and conscious buyers in Ramsay & Inglewood, Calgary. The mission: make local food easy to access, support small producers, and build a neighbourhood where quality and connection matter.",
      approachIntro:
        "We ran strategy and research to define the core features, mapping the weekly ordering and pickup flows. Shopify was chosen as the MVP platform for a fast launch with room to scale.",
      approach: [
        "Clear product structure and categories",
        "Easy seller onboarding",
        "Weekly pickup logistics — order Monday, pick up Wednesday",
        "Free memberships to reduce friction",
        "Trust-building copy and local storytelling",
      ],
      implementation:
        "We delivered a functional Shopify storefront, Tally form integration for product submissions, and automated order summaries for sellers.",
      results:
        "The MVP launched successfully on Shopify — buyers can browse products and schedule weekly pickups, while sellers receive automated Monday order summaries. The structure supports future custom dashboards, multi-location pickup, and enhanced inventory tracking across Calgary.",
      quote:
        "Underground Foods is now positioned to grow, attract more makers, and become a digital hub supporting small businesses across Calgary.",
      images: [
        { src: "/work/underground-foods/cover.png", alt: "Underground Foods website shown on a laptop" },
        { src: "/work/underground-foods/homepage.png", alt: "Underground Foods homepage — shop local whole foods" },
        { src: "/work/underground-foods/features.png", alt: "For Farmers & Makers: how it works section" },
        { src: "/work/underground-foods/membership.png", alt: "Buyer and Seller membership tiers" },
        { src: "/work/underground-foods/shopify-admin.png", alt: "Shopify admin product catalogue" },
      ],
    },
  },
  {
    name: "DigitalAI",
    type: "AI SaaS · Framer",
    year: "2024",
    slug: "digitalai",
    cover: "/work/digitalai/cover.png",
    summary:
      "A bold, dark-themed single-page site and no-code MVP for an AI lead-generation startup — built in Framer with an Airtable lead workflow.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "AI lead-gen startup" },
        { label: "Year", value: "2024" },
        { label: "Stack", value: "Framer · Airtable" },
        { label: "Services", value: "UX, Copy, No-code Build" },
      ],
      overview:
        "DigitalAI is an early-stage startup automating lead generation for businesses through AI-powered workflows. The goal: a modern single-page site that positions the brand as innovative and trustworthy, while validating the concept with a functional MVP.",
      approachTitle: "Our process",
      approachIntro:
        "We ran research and strategy, sharpened the messaging, designed a bold dark-themed interface, and shipped the whole thing as a no-code MVP in Framer.",
      approach: [
        "Audience analysis, competitor research & clear USPs",
        "Conversion-focused UX structure and flow",
        "Value-based copy with a clear problem → solution narrative",
        "Modern dark theme — bold type, gradients, neon accents, micro-interactions",
        "Built fully in Framer with a pop-up contact form",
        "Airtable integration for lead management",
      ],
      implementation:
        "Everything was delivered as a responsive, performance-optimized single-page experience — ready to put in front of investors and early clients.",
      results: "The launch delivered measurable outcomes and a validated MVP:",
      resultsList: [
        "3.8% conversion rate in the first months",
        "Improved engagement & time on page",
        "Seamless Airtable workflow for incoming leads",
        "MVP ready for investor & client validation",
      ],
      images: [
        { src: "/work/digitalai/cover.png", alt: "DigitalAI website shown across two displays" },
        { src: "/work/digitalai/hero.png", alt: "DigitalAI hero — transform traffic into qualified leads" },
        { src: "/work/digitalai/features.png", alt: "Why choose our AI Bot — feature grid" },
        { src: "/work/digitalai/results.png", alt: "Proven results — conversion, time saved and uptime stats" },
        { src: "/work/digitalai/pricing.png", alt: "Flexible pricing plans for every business" },
      ],
    },
  },
  {
    name: "Finverity",
    type: "Fintech · Webflow",
    year: "2023",
    slug: "finverity",
    cover: "/work/finverity/cover.png",
    summary:
      "A 7-page Webflow site for a wealth-management firm, backed by Airtable and Notion with automation to streamline client and internal operations.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "Wealth Management" },
        { label: "Year", value: "2023" },
        { label: "Stack", value: "Webflow · Airtable · Notion" },
        { label: "Services", value: "UX, Web Design & Dev, Automation" },
      ],
      overview:
        "Finverity is redefining wealth management by combining technology with personalized financial services. We built a 7-page Webflow site backed by Airtable and Notion — supporting both a polished client experience and the team's internal operations.",
      approachTitle: "Our process",
      approachIntro:
        "We moved from strategy and UX into a trust-building UI, then a Webflow build wired to automated data and collaboration tools.",
      approach: [
        "Wireframes, sitemap & conversion-focused user journeys",
        "Market research & positioning",
        "Professional, trust-building UI with clear hierarchy",
        "Responsive layouts across all devices",
        "7-page Webflow build",
        "Airtable for data, Notion for team collaboration",
        "Custom automation to cut manual work and support scale",
      ],
      implementation:
        "Third-party integrations tie the stack together, so the site and its workflows scale as the business grows.",
      results: "Key outcomes for Finverity:",
      resultsList: [
        "Faster processing of client requests",
        "Reduced manual data entry",
        "Clear internal workflows",
        "Professional online presence ready for growth",
      ],
      images: [
        { src: "/work/finverity/cover.png", alt: "Finverity homepage — streamline your wealth" },
        { src: "/work/finverity/overview.png", alt: "Gain a complete overview of your financial horizon" },
        { src: "/work/finverity/benefits.png", alt: "Finverity stats and benefits section" },
        { src: "/work/finverity/problem-solution.png", alt: "Problem and solution breakdown, built just for you" },
        { src: "/work/finverity/showcase.png", alt: "Collage of Finverity website screens" },
      ],
    },
  },
];

export const values = [
  {
    title: "Creativity",
    body: "Creativity drives everything we do. We push boundaries, explore fresh perspectives, and design unique solutions that reflect each client's vision.",
  },
  {
    title: "Collaboration",
    body: "We see collaboration as the key to success. By working closely with clients, we make sure every project reflects their goals.",
  },
  {
    title: "Excellence",
    body: "Excellence defines our standards. From strategy to execution, we focus on delivering outstanding quality in every detail.",
  },
];

export const ctaText =
  "Ready to take your brand to the next level? Partner with Digital Builders today for design solutions crafted to deliver lasting impact, creativity, and measurable growth.";
