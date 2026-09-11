export type Plan = "1page" | "3page" | "5page";
export type VoicePlan = "voice_afterhours" | "voice_frontdesk" | "voice_pro";
export type ProductFamily = "website" | "voice";
export type Source = "truetrades" | "stroll" | "dirtlink" | "direct" | "referral";
export type ClientStatus = "paid" | "in_progress" | "ready_to_build" | "building" | "in_review" | "revising" | "live" | "suspended";
export type VoiceAgentStatus = "paid" | "in_progress" | "ready_to_build" | "building" | "test_call" | "revising" | "live" | "cancellation_pending" | "paused" | "cancelled";
export type StepState = "not_started" | "draft" | "complete";
export type AssetCategory = "work" | "team" | "equipment" | "logo" | "other";
export type AssetKind = "uploaded" | "stock" | "generated";

export type Client = {
  id: string;
  /** @deprecated Product ownership is inferred from website steps/voice_agents. */
  product_family?: ProductFamily;
  source: Source;
  coupon_code?: string;
  /** Website purchase fields. Optional for voice-only clients. */
  plan?: Plan;
  amount_paid?: number;
  stripe_session_id?: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  magic_token: string;
  token_expires_at: string;
  session_token?: string;
  session_expires_at?: string;
  status?: ClientStatus;
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
export type VoiceStepData = { voice_agent_id: string; step_number: number; data: Record<string, unknown>; state: StepState; updated_at: string; completed_at?: string };
export type VoiceAgent = {
  id: string;
  client_id: string;
  source: Source;
  coupon_code?: string;
  plan: VoicePlan;
  billing_interval: "month" | "year";
  status: VoiceAgentStatus;
  setup_stripe_session_id: string;
  setup_amount_paid: number;
  stripe_customer_id?: string;
  stripe_payment_method_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: string;
  go_live_state?: "subscription_created" | "binding_pending" | "binding_failed" | "live";
  go_live_error?: string;
  provisioned_number?: string;
  twilio_number_sid?: string;
  vapi_phone_number_id?: string;
  vapi_assistant_id?: string;
  provisioning_state?: "pending" | "provisioning" | "provisioned" | "failed";
  provisioning_started_at?: string;
  provisioning_lease_token?: string;
  provisioning_lease_expires_at?: string;
  provisioning_attempts?: number;
  provisioning_error?: string;
  minutes_included: number;
  minutes_used_current_period: number;
  period_start?: string;
  period_end?: string;
  /** Included minutes renew monthly, independently of Stripe billing cadence. */
  usage_period_start?: string;
  usage_period_end?: string;
  first_overage_forgiven_at?: string;
  package_generated_at?: string;
  package_manifest?: Record<string, string>;
  package_notified_at?: string;
  approved_at?: string;
  cancellation_requested_at?: string;
  cancellation_effective_at?: string;
  provider_unbound_at?: string;
  provider_cleanup_status?: "pending" | "completed" | "failed";
  provider_cleanup_error?: string;
  created_at: string;
  live_at?: string;
  cancelled_at?: string;
  /** Cancellation never erases CRM records. Deletion requires a separately approved request. */
  records_retention_status?: "retained_for_export_and_support";
};
export type VoiceMemo = { id: string; voice_agent_id: string; step_number: number; storage_key: string; duration_s?: number; transcript?: string; transcribed_at?: string; created_at: string };
export type CallRecord = { id: string; voice_agent_id: string; vapi_call_id: string; direction: string; from_number?: string; to_number?: string; started_at: string; ended_at?: string; duration_s: number; cost_usd?: number; transcript?: string; summary?: string; outcome?: string; ended_reason?: string; recording_url?: string; lead_sent_at?: string };
export type Asset = { id: string; client_id: string; storage_key: string; original_filename: string; category: AssetCategory; kind: AssetKind; width?: number; height?: number; bytes: number; created_at: string };
export type Revision = { id: string; client_id: string; round: number; requested_at: string; notes: string; resolved_at?: string };
export type VoiceRevision = { id: string; voice_agent_id: string; round: number; requested_at: string; notes: string; resolved_at?: string };
export type UsageAlert = { id: string; voice_agent_id: string; period_start: string; threshold: 80 | 100; sent_at?: string };
export type CouponReservation = { id: string; coupon_code: string; product_family: ProductFamily; idempotency_key: string; status: "reserved" | "redeemed" | "released" | "expired"; reserved_at: string; expires_at: string; redeemed_at?: string; stripe_session_id?: string; requester_email_hash?: string; requester_ip_hash?: string };
export type IdempotencyRecord = { key: string; scope: string; resource_id?: string; created_at: string };
export type TestCallAttempt = { id: string; voice_agent_id: string; idempotency_key: string; destination: string; status: "pending" | "started" | "failed"; created_at: string; vapi_call_id?: string; error?: string };
export type VoiceAuditLog = { id: string; voice_agent_id: string; action: string; detail: string; created_at: string };
export type Coupon = { code: string; source: Source; price_1page?: number; price_3page?: number; price_5page?: number; price_voice_setup?: number; expires_at?: string; max_uses?: number; uses: number; active: boolean };
export type PortalDb = {
  clients: Client[];
  steps: StepData[];
  assets: Asset[];
  revisions: Revision[];
  coupons: Coupon[];
  voice_agents: VoiceAgent[];
  voice_steps: VoiceStepData[];
  voice_memos: VoiceMemo[];
  call_records: CallRecord[];
  voice_revisions: VoiceRevision[];
  usage_alerts: UsageAlert[];
  coupon_reservations: CouponReservation[];
  idempotency_records: IdempotencyRecord[];
  test_call_attempts: TestCallAttempt[];
  voice_audit_logs: VoiceAuditLog[];
};

export const plans: Record<Plan, { name: string; amount: number; summary: string }> = {
  "1page": { name: "One-Pager", amount: 59900, summary: "One scrolling page, ready in about one week after intake completion." },
  "3page": { name: "Essential", amount: 99900, summary: "Home, services, and contact pages for growing trades businesses." },
  "5page": { name: "Professional", amount: 149500, summary: "Up to five pages for richer services, portfolio, and trust content." },
};

export const voicePlans: Record<VoicePlan, { name: string; monthly: number; annual: number; minutes: number; calls: number; overage: number; summary: string }> = {
  voice_afterhours: { name: "After-Hours", monthly: 9900, annual: 99000, minutes: 150, calls: 60, overage: 55, summary: "Evenings, weekends and holidays — the calls currently going to voicemail." },
  voice_frontdesk: { name: "Front Desk", monthly: 24900, annual: 249000, minutes: 500, calls: 200, overage: 45, summary: "Every call you do not answer, all day, with booking and call transfers." },
  voice_pro: { name: "Front Desk Pro", monthly: 44900, annual: 449000, minutes: 1200, calls: 480, overage: 35, summary: "Busy shops with real call volume and several people to route between." },
};
export const voiceSetupAmount = 49900;

export const stepMeta = [
  { number: 1, title: "Choose your look", time: "3 min" },
  { number: 2, title: "Add your photos", time: "10 min" },
  { number: 3, title: "Your domain name", time: "5 min" },
  { number: 4, title: "Business details", time: "5 min" },
  { number: 5, title: "Hours of operation", time: "2 min" },
  { number: 6, title: "Tell us about your work", time: "8 min" },
];

export const voiceStepMeta = [
  { number: 1, title: "How calls reach your agent", time: "2 min" },
  { number: 2, title: "When it answers", time: "1 min" },
  { number: 3, title: "What it should do", time: "3 min" },
  { number: 4, title: "What it needs to know", time: "4 min" },
  { number: 5, title: "Where your leads go", time: "1 min" },
  { number: 6, title: "Voice and greeting", time: "1 min" },
];
