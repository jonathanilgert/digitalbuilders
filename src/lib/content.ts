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
  bookingUrl: "/portal/start",
  linkedin: "https://www.linkedin.com/company/110243692",
  founded: 2024,
  contacts: [
    { name: "Digital Builders", phone: "825-949-1010", phoneHref: "tel:+18259491010" },
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
  { value: "50+", label: "Projects delivered" },
  { value: "98%", label: "Client satisfaction rate" },
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
    name: "One-Pager",
    price: "$599",
    cadence: "one-time",
    tagline:
      "Everything a customer needs on one clean scrolling page: who you are, what you do, and how to call you.",
    features: [
      "1 page",
      "Quote form",
      "Click-to-call",
      "Mobile-ready",
      "Basic SEO setup",
      "Built in about one week",
    ],
    featured: false,
  },
  {
    name: "Essential",
    price: "$999",
    cadence: "one-time",
    tagline:
      "Three pages — Home, Services, Contact — with room to explain what you do and the areas you serve.",
    features: [
      "3 pages",
      "Everything in One-Pager",
      "Service pages",
      "Photo gallery",
      "One round of revisions",
      "Launch included",
    ],
    featured: true,
  },
  {
    name: "Professional",
    price: "$1,495",
    cadence: "one-time",
    tagline:
      "Up to five pages for businesses with more to say: multiple services, a portfolio, an about page, or financing details.",
    features: [
      "Up to 5 pages",
      "Everything in Essential",
      "Expanded SEO setup",
      "Portfolio or about page",
      "One round of revisions",
      "Launch included",
    ],
    featured: false,
  },
  {
    name: "Online Store",
    price: "from $2,950",
    cadence: "one-time",
    tagline: "For e-commerce builds that sell products, accept payments, or support online bookings.",
    features: [
      "Product pages and collections",
      "Stripe or Shopify checkout",
      "Order or booking flow",
      "Mobile-ready storefront",
      "Launch included",
    ],
    featured: false,
  },
  {
    name: "Custom / Scale",
    price: "from $5,000",
    cadence: "per project",
    tagline: "For custom layouts, portals, dashboards, automations, or larger product builds.",
    features: [
      "Discovery call + strategy session",
      "Custom UX/UI and full branding",
      "User journey planning and research",
      "Automations and custom features",
      "Booking / CRM / portal / dashboard",
      "SEO structure and content strategy",
    ],
    featured: false,
  },
];

export const ownershipPromise = {
  title: "Your domain is registered in your name.",
  body: "Ask for the transfer code any time, and we'll send it within one business day. Domains are $19/year, registered in your name, with renewal folded into the care plan from year two. No contracts, no lock-in, and if you ever leave we'll hand you a copy of your site. We'd rather earn the next month than trap you in it.",
};

export const pricingNotes = [
  "Every build includes mobile-responsive design, one of five templates, a contact or quote form, click-to-call, basic SEO setup, Google Business Profile link, SSL, and launch.",
  "One round of revisions is included. Further changes and out-of-scope work are quoted separately at $110/hour.",
  "Template choice is the design decision. We write the copy from your guided answers, and photos can be yours, curated stock, or generated imagery.",
];

export const carePlan = {
  name: "Care Plan",
  price: "$49",
  cadence: "/month",
  annualPrice: "$490/year",
  tagline:
    "Hosting, SSL, daily backups, security updates, uptime monitoring, and small content changes whenever you need them. Month-to-month. No contract. Cancel any time.",
  features: [
    "Hosting, SSL and daily backups",
    "Security updates",
    "Uptime monitoring",
    "Small content edits (~30 min/mo)",
    "Monthly health check",
    "$490/year option — two months free",
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
    a: "One-page sites are $599, Essential three-page sites are $999, Professional sites up to five pages are $1,495, online stores start from $2,950, and custom builds start from $5,000. Care plans and domains are billed separately.",
  },
  {
    q: "How long does it take to complete a website?",
    a: "One-Pager builds can be live in about one week once we have your guided answers and photos. Essential and Professional builds are typically live in about two weeks. Larger stores and custom builds take longer — we'll give you a realistic timeline up front.",
  },
  {
    q: "Do I need to provide all the content myself?",
    a: "Not necessarily. We're happy to work with the content you have, help shape your messaging, and guide you on images and copy where you need a hand.",
  },
  {
    q: "Can I edit the website after it's launched?",
    a: "Yes. We include one revision round before launch. After launch, small content edits are covered by the Care Plan; larger changes are quoted separately.",
  },
  {
    q: "Will my website be optimized for mobile and speed?",
    a: "Always. Every site we build is fully responsive and tuned for fast load times and strong performance across devices.",
  },
  {
    q: "Do you offer support after launch?",
    a: "Yes. Our $49/month Care Plan — or $490/year, two months free — covers hosting, SSL, daily backups, security updates, uptime monitoring, small content edits, and a monthly health check. It is month-to-month with no contract.",
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
      "A map-based marketplace that helps Calgary construction teams post, find, and move earth material nearby.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "Construction · Calgary, AB" },
        { label: "Timeline", value: "4 months" },
        { label: "Services", value: "Brand, UX/UI, Full-stack Build" },
        { label: "Live site", value: "dirtlink.ca", href: "https://dirtlink.ca" },
      ],
      overview:
        "DirtLink gives construction teams a regional map for earth material. Sites can post what they have or need, then connect with nearby operators before the next truck rolls.",
      approachTitle: "Our approach",
      approachIntro:
        "We shaped the product around field use: fast posting, map-first discovery, clear listing details, and direct paths from a site need to a nearby match.",
      approach: [
        "Map-based discovery for sites, pins, and listings",
        "Have / Need listings for matching material nearby",
        "Filters for material type, quantity, radius, access, and availability",
        "Direct messaging and claimed site ownership flows",
        "Mobile-friendly interface for truck dash and site trailer use",
      ],
      implementation:
        "Built as a custom web app with a live Calgary beta, structured for listings, accounts, maps, and future marketplace growth.",
      results: "Delivered and launched as a working early-access product:",
      resultsList: [
        "Replaced scattered texts and spreadsheets with one map",
        "Created a clearer workflow for material reuse across nearby sites",
        "Supported contractors, operators, trucking, developers, and municipalities",
      ],
      quote: "Earth material shouldn't be the thing that holds your schedule hostage.",
      images: [
        { src: "/work/dirtlink/cover.png", alt: "DirtLink website screenshot" },
        { src: "/work/dirtlink/app-map.png", alt: "DirtLink app — map of Calgary sites with material pins and filters" },
        { src: "/work/dirtlink/how-it-works.png", alt: "Four steps from pile to placement" },
        { src: "/work/dirtlink/audience.png", alt: "Every role along the dirt — who DirtLink is built for" },
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
      "A simple e-signature web app for uploading a PDF, placing signing fields, and sending documents without the usual bloat.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "SaaS · E-signature" },
        { label: "Timeline", value: "1 month" },
        { label: "Services", value: "Brand, UX/UI, Full-stack Build" },
        { label: "Live site", value: "penned.ca", href: "https://penned.ca" },
      ],
      overview:
        "Penned makes online signatures feel lightweight: upload a PDF, place signature fields, and send it out for signing from any device.",
      approachTitle: "Our approach",
      approachIntro:
        "We kept the product focused on the core job: a fast document flow, clear signing state, and simple pricing instead of a heavy enterprise suite.",
      approach: [
        "Upload-first document flow",
        "Point-and-click signature, initial, date, and text fields",
        "Recipient signing without account friction",
        "Dashboard for documents, statuses, and saved templates",
        "Simple pricing for occasional and frequent document senders",
      ],
      implementation:
        "Designed and built as a full-stack SaaS experience with signing workflows, account areas, document handling, and billing seams.",
      results: "Launched a focused e-signature product with a clear customer path:",
      resultsList: [
        "Reduced signing to a short, understandable workflow",
        "Made the free tier and paid options easy to understand",
        "Presented a cleaner alternative to oversized signature platforms",
      ],
      quote: "Boring on purpose. Reliable by design.",
      images: [
        { src: "/work/penned/cover.png", alt: "Penned website screenshot" },
        { src: "/work/penned/dashboard.png", alt: "Penned dashboard — documents, usage and saved templates" },
        { src: "/work/penned/how-it-works.png", alt: "Three steps — upload, place fields, send" },
        { src: "/work/penned/pricing.png", alt: "Pricing — free, pay-as-you-go and unlimited plans" },
      ],
    },
  },
  {
    name: "Digital Builders",
    type: "Agency Website · Portal",
    year: "2026",
    slug: "digitalbuilders",
    cover: "/work/digitalbuilders/cover.png",
    summary:
      "Our own studio website and intake portal for packaged website builds, care plans, payments, and project onboarding.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "Web design studio" },
        { label: "Stack", value: "Next.js · Stripe · CRM" },
        { label: "Services", value: "Brand, Website, Portal, Payments" },
        { label: "Live site", value: "digitalbuilders.ca", href: "https://digitalbuilders.ca" },
      ],
      overview:
        "Digital Builders needed a site that explains the offer quickly, shows real work, and routes new clients into a structured intake and payment flow.",
      approachTitle: "Our approach",
      approachIntro:
        "We combined a polished public marketing site with a practical backend path for enquiries, pricing, checkout, and project intake.",
      approach: [
        "Clear service and pricing pages for local business owners",
        "Portfolio and case-study structure for shipped projects",
        "Stripe-backed intake and checkout flow",
        "CRM-connected project tracking and operational handoff",
        "Self-hosted analytics and production deployment on DigitalOcean",
      ],
      implementation:
        "Built as a production Next.js site with static marketing pages, server-backed portal routes, Stripe integration, and Digital Builders CRM connections.",
      results: "A sharper agency site with the operations layer behind it:",
      resultsList: [
        "Made packages, care plans, and ownership terms easier to understand",
        "Added a structured path from interest to intake",
        "Created a portfolio system for current and future projects",
      ],
      quote: "Built for the same clarity we sell to clients.",
      images: [
        { src: "/work/digitalbuilders/cover.png", alt: "Digital Builders website screenshot" },
      ],
    },
  },
  {
    name: "Wild Rose Peptides",
    type: "E-commerce · Admin Backend",
    year: "2026",
    slug: "wildrosepeptides",
    cover: "/work/wildrosepeptides/cover.png",
    summary:
      "A beta-gated peptide storefront with product catalogue, checkout, COA publishing, order handling, and admin tooling.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "E-commerce · Wellness" },
        { label: "Stack", value: "Astro · Python · SQLite · Stripe" },
        { label: "Services", value: "Storefront, Checkout, Admin, COA System" },
        { label: "Live site", value: "wildrosepeptides.ca", href: "https://wildrosepeptides.ca" },
      ],
      overview:
        "Wild Rose Peptides needed a trustworthy product storefront plus an operational backend for inventory, checkout, certificates of analysis, customer data, and fulfilment workflows.",
      approachTitle: "Our approach",
      approachIntro:
        "We treated the storefront and admin tools as one system: polished public pages, careful product data, secure uploads, and admin actions that update what customers see.",
      approach: [
        "Responsive storefront and product pages",
        "Stripe checkout and order handling",
        "COA upload, archive, restore, and customer-accessible report links",
        "Inventory and price management through a protected admin area",
        "Shipping and contact workflow integrations",
      ],
      implementation:
        "Delivered as a static storefront with companion backend services on DigitalOcean, including protected admin routes and runtime storage for live operations.",
      results: "A production-ready commerce foundation for a regulated catalogue:",
      resultsList: [
        "Connected product, inventory, checkout, and COA data",
        "Reduced manual certificate and order-management work",
        "Kept sensitive admin tooling separated from the customer storefront",
      ],
      quote: "Trust-building commerce needs clean public pages and careful backend controls.",
      images: [
        { src: "/work/wildrosepeptides/cover.png", alt: "Wild Rose Peptides website screenshot" },
      ],
    },
  },
  {
    name: "TrueTrades",
    type: "Directory · Lead Generation",
    year: "2026",
    slug: "truetrades",
    cover: "/work/truetrades/cover.png",
    summary:
      "A Calgary trades directory built to help homeowners browse categories, compare contractors, and request quotes.",
    caseStudy: {
      facts: [
        { label: "Industry", value: "Trades · Local directory" },
        { label: "Location", value: "Calgary, AB" },
        { label: "Services", value: "Directory UX, Content System, Lead Forms" },
        { label: "Live site", value: "truetrades.ca", href: "https://truetrades.ca" },
      ],
      overview:
        "TrueTrades gives homeowners a calmer way to browse local trades categories and request quotes without sorting through noisy generic search results.",
      approachTitle: "Our approach",
      approachIntro:
        "We focused the experience around fast category browsing, compact contractor cards, and quote prompts that stay available without overwhelming the listings.",
      approach: [
        "Category landing pages with visual service cards",
        "Compact contractor listings with forward-facing copy",
        "Sticky quote request panel on larger screens",
        "Lead form handling and notification service",
        "SEO-friendly static structure for local search growth",
      ],
      implementation:
        "Built as a fast static directory with a lightweight backend contact handler, hosted behind Nginx on DigitalOcean.",
      results: "A local directory foundation ready to grow category by category:",
      resultsList: [
        "Made service categories easier to scan and navigate",
        "Cleaned contractor cards for a more customer-facing feel",
        "Added a quote path that remains accessible while browsing",
      ],
      quote: "Find the right trade without the search-engine chaos.",
      images: [
        { src: "/work/truetrades/cover.png", alt: "TrueTrades website screenshot" },
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
