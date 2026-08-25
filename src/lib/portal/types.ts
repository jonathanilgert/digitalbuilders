export type Plan = "1page" | "3page" | "5page";
export type Source = "truetrades" | "stroll" | "dirtlink" | "direct" | "referral";
export type ClientStatus = "paid" | "in_progress" | "ready_to_build" | "building" | "in_review" | "revising" | "live" | "suspended";
export type StepState = "not_started" | "draft" | "complete";
export type AssetCategory = "work" | "team" | "equipment" | "logo" | "other";
export type AssetKind = "uploaded" | "stock" | "generated";

export type Client = {
  id: string;
  source: Source;
  coupon_code?: string;
  plan: Plan;
  amount_paid: number;
  stripe_session_id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  magic_token: string;
  token_expires_at: string;
  session_token?: string;
  session_expires_at?: string;
  status: ClientStatus;
  preview_slug: string;
  mx_preflight_required?: boolean;
  internal_note?: string;
  build_package_generated_at?: string;
  ready_notified_at?: string;
  build_package_path?: string;
  created_at: string;
  completed_at?: string;
  launched_at?: string;
};

export type StepData = { client_id: string; step_number: number; data: Record<string, unknown>; state: StepState; updated_at: string; completed_at?: string };
export type Asset = { id: string; client_id: string; storage_key: string; original_filename: string; category: AssetCategory; kind: AssetKind; width?: number; height?: number; bytes: number; created_at: string };
export type Revision = { id: string; client_id: string; round: number; requested_at: string; notes: string; resolved_at?: string };
export type Coupon = { code: string; source: Source; price_1page?: number; price_3page?: number; price_5page?: number; expires_at: string; max_uses?: number; uses: number; active: boolean };
export type PortalDb = { clients: Client[]; steps: StepData[]; assets: Asset[]; revisions: Revision[]; coupons: Coupon[] };

export const plans: Record<Plan, { name: string; amount: number; summary: string }> = {
  "1page": { name: "One-Pager", amount: 59900, summary: "One scrolling page, ready in about one week after intake completion." },
  "3page": { name: "Essential", amount: 99900, summary: "Home, services, and contact pages for growing trades businesses." },
  "5page": { name: "Professional", amount: 149500, summary: "Up to five pages for richer services, portfolio, and trust content." },
};

export const stepMeta = [
  { number: 1, title: "Choose your look", time: "3 min" },
  { number: 2, title: "Add your photos", time: "10 min" },
  { number: 3, title: "Your domain name", time: "5 min" },
  { number: 4, title: "Business details", time: "5 min" },
  { number: 5, title: "Hours of operation", time: "2 min" },
  { number: 6, title: "Tell us about your work", time: "8 min" },
];
