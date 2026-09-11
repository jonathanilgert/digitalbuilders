import { mkdir, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Asset, Client, ClientStatus, Coupon, CouponReservation, Plan, PortalDb, ProductFamily, Revision, Source, StepData, VoiceAgent, VoicePlan, VoiceStepData } from "./types";
import { stepMeta, voicePlans, voiceStepMeta } from "./types";
import { initializePortalDb, portalDataRoot, readPortalState, replacePortalState, transactPortalState } from "./db";

function root() { return portalDataRoot(); }

function now() { return new Date().toISOString(); }
export function uid(prefix = "id") { return `${prefix}_${crypto.randomBytes(12).toString("hex")}`; }
export function magicToken() { return crypto.randomBytes(32).toString("base64url"); }
export function slugify(input: string) { return (input || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "website"; }

function seedCoupons(): Coupon[] {
  const expires = new Date(Date.now() + 30 * 864e5).toISOString();
  const website = ["truetrades26", "dirtlink26", "stroll26", "direct26"].map((code) => ({
    code,
    source: code.replace("26", "") as Source,
    price_1page: 34900,
    price_3page: 59900,
    price_5page: 99500,
    expires_at: expires,
    uses: 0,
    active: true,
  }));
  return [...website, { code: "voice26", source: "direct", price_voice_setup: 24900, max_uses: 5, uses: 0, active: true }];
}

function emptyDb(): PortalDb {
  return {
    clients: [], steps: [], assets: [], revisions: [], coupons: seedCoupons(),
    voice_agents: [], voice_steps: [], voice_memos: [], call_records: [],
    voice_revisions: [], usage_alerts: [], coupon_reservations: [], idempotency_records: [], test_call_attempts: [], voice_audit_logs: [],
  };
}

/** Adds newly introduced collections and moves legacy voice purchase data off Client. */
export function normalizePortalDb(input: Partial<PortalDb>): PortalDb {
  const db = Object.assign(emptyDb(), input) as PortalDb;
  db.clients ||= []; db.steps ||= []; db.assets ||= []; db.revisions ||= [];
  db.coupons ||= seedCoupons(); db.voice_agents ||= []; db.voice_steps ||= [];
  db.voice_memos ||= []; db.call_records ||= []; db.voice_revisions ||= [];
  db.usage_alerts ||= []; db.coupon_reservations ||= []; db.idempotency_records ||= []; db.test_call_attempts ||= []; db.voice_audit_logs ||= [];
  if (!db.coupons.some((coupon) => coupon.code === "voice26")) db.coupons.push(seedCoupons().find((coupon) => coupon.code === "voice26")!);
  for (const client of db.clients) {
    const legacyPlan = client.plan as Plan | VoicePlan | undefined;
    if (client.product_family === "voice" || legacyPlan?.startsWith("voice_")) {
      const agent = db.voice_agents.find((item) => item.client_id === client.id);
      if (agent) {
        agent.source ||= client.source || "direct";
        agent.coupon_code ||= client.coupon_code;
        agent.setup_stripe_session_id ||= client.stripe_session_id || "";
        agent.setup_amount_paid ||= client.amount_paid || 0;
      }
      // A stable owner has no shared product payment/status fields when voice-only.
      if (!db.steps.some((step) => step.client_id === client.id)) {
        delete client.plan; delete client.amount_paid; delete client.stripe_session_id;
      }
    }
  }
  for (const agent of db.voice_agents) {
    if (agent.status === "cancelled") agent.records_retention_status ||= "retained_for_export_and_support";
  }
  return db;
}

export async function migratePortalData() { return initializePortalDb(emptyDb, normalizePortalDb); }
export async function readDb(): Promise<PortalDb> { return readPortalState(emptyDb, normalizePortalDb); }
export async function writeDb(db: PortalDb) { await replacePortalState(db, emptyDb, normalizePortalDb); }
export async function mutateDb<T>(fn: (db: PortalDb) => T | Promise<T>): Promise<T> {
  return transactPortalState(emptyDb, normalizePortalDb, fn);
}

export function blankSteps(clientId: string): StepData[] { return stepMeta.map((s) => ({ client_id: clientId, step_number: s.number, data: {}, state: "not_started", updated_at: now() })); }
export function blankVoiceSteps(voiceAgentId: string, defaults: Record<number, Record<string, unknown>> = {}): VoiceStepData[] {
  return voiceStepMeta.map((s) => ({ voice_agent_id: voiceAgentId, step_number: s.number, data: defaults[s.number] || {}, state: "not_started", updated_at: now() }));
}
export function isIntakeComplete(steps: StepData[]) { return stepMeta.every((s) => steps.find((x) => x.step_number === s.number)?.state === "complete"); }
export function isAgentIntakeComplete(steps: VoiceStepData[]) { return voiceStepMeta.every((s) => steps.find((x) => x.step_number === s.number)?.state === "complete"); }
export async function updateClientStatusFromSteps(clientId: string, db: PortalDb) {
  const client = db.clients.find((c) => c.id === clientId); if (!client) return;
  const complete = isIntakeComplete(db.steps.filter((s) => s.client_id === clientId));
  if (complete && ["paid", "in_progress"].includes(client.status || "")) {
    client.status = "ready_to_build";
    client.completed_at ||= now();
    await generateBuildPackage(db, clientId);
  } else if (!complete && client.status === "paid") client.status = "in_progress";
}
export async function createPaidClient(input: { source: Source; coupon_code?: string; coupon_reservation_id?: string; plan: Plan; amount_paid: number; stripe_session_id: string; business_name: string; contact_name: string; email: string; phone: string; }): Promise<Client> {
  return mutateDb(async (db) => {
    const existing = db.clients.find((c) => c.stripe_session_id === input.stripe_session_id);
    if (existing) return existing;
    let client = db.clients.find((c) => c.email.toLowerCase() === input.email.toLowerCase());
    const business = input.business_name || "New website";
    if (client) {
      if (db.steps.some((step) => step.client_id === client!.id)) throw new Error("This client already owns a website purchase");
      Object.assign(client, { source: input.source, coupon_code: input.coupon_code, plan: input.plan, amount_paid: input.amount_paid, stripe_session_id: input.stripe_session_id, business_name: business, contact_name: input.contact_name || client.contact_name, phone: input.phone || client.phone, product_family: "website" as const, status: "paid" as const, preview_slug: slugify(business) });
    } else {
      client = { id: uid("client"), ...input, product_family: "website", magic_token: magicToken(), token_expires_at: new Date(Date.now() + 180 * 864e5).toISOString(), status: "paid", preview_slug: slugify(business), created_at: now() };
      db.clients.push(client);
    }
    db.steps.push(...blankSteps(client.id));
    redeemCoupon(db, input.coupon_code, "website", input.coupon_reservation_id, input.stripe_session_id);
    return client;
  });
}

export async function websiteClientForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const db = await readDb();
  return db.clients.find((client) => client.email.toLowerCase() === normalized && db.steps.some((step) => step.client_id === client.id)) || null;
}

function websitePrefill(db: PortalDb, client: Client, plan: VoicePlan) {
  const candidate = db.clients.find((c) => c.id === client.id && (c.product_family || "website") === "website") || db.clients.find((c) => (c.product_family || "website") === "website" && c.email.toLowerCase() === client.email.toLowerCase());
  const websiteClient = candidate && isIntakeComplete(db.steps.filter((step) => step.client_id === candidate.id)) ? candidate : undefined;
  const business = websiteClient ? db.steps.find((s) => s.client_id === websiteClient.id && s.step_number === 4)?.data || {} : {};
  const hours = websiteClient ? db.steps.find((s) => s.client_id === websiteClient.id && s.step_number === 5)?.data || {} : {};
  const content = websiteClient ? db.steps.find((s) => s.client_id === websiteClient.id && s.step_number === 6)?.data || {} : {};
  return {
    1: { existing_number: client.phone, carrier: "Not sure", routing_mode: "forward_no_answer", rings_before_forward: 4 },
    2: { ...hours, ...(websiteClient ? { prefilled_from_website: true } : {}), coverage: plan === "voice_afterhours" ? "after_hours_only" : "overflow_and_after_hours" },
    4: { services: content.q1 || "", service_area: business.service_areas || content.q4 || "", ...(websiteClient ? { prefilled_from_website: true } : {}) },
    5: { sms_to: [client.phone].filter(Boolean), email_to: [client.email].filter(Boolean), delivery: "immediate", fallback_number: client.phone, account_owner: client.contact_name, ...(websiteClient ? { prefilled_from_website: true } : {}) },
  };
}

export async function createPaidVoiceAgent(input: { source: Source; coupon_code?: string; coupon_reservation_id?: string; plan: VoicePlan; billing_interval: "month" | "year"; amount_paid: number; stripe_session_id: string; stripe_customer_id?: string; stripe_payment_method_id?: string; business_name: string; contact_name: string; email: string; phone: string; }): Promise<{ client: Client; voiceAgent: VoiceAgent }> {
  return mutateDb((db) => {
    const existingAgent = db.voice_agents.find((a) => a.setup_stripe_session_id === input.stripe_session_id);
    if (existingAgent) {
      const owner = db.clients.find((c) => c.id === existingAgent.client_id);
      if (!owner) throw new Error("Voice agent has no owning client");
      return { client: owner, voiceAgent: existingAgent };
    }
    let client: Client | undefined = db.clients.find((c) => c.email.toLowerCase() === input.email.toLowerCase());
    if (!client) {
      client = { id: uid("client"), product_family: "voice", source: input.source, business_name: input.business_name || "New voice agent", contact_name: input.contact_name, email: input.email, phone: input.phone, magic_token: magicToken(), token_expires_at: new Date(Date.now() + 180 * 864e5).toISOString(), preview_slug: slugify(input.business_name || "voice-agent"), created_at: now() };
      db.clients.push(client);
    }
    const owner = client;
    if (db.voice_agents.some((agent) => agent.client_id === owner.id)) throw new Error("This client already owns a voice agent");
    const voiceAgent: VoiceAgent = { id: uid("voice"), client_id: owner.id, source: input.source, coupon_code: input.coupon_code, plan: input.plan, billing_interval: input.billing_interval, status: "paid", setup_stripe_session_id: input.stripe_session_id, setup_amount_paid: input.amount_paid, stripe_customer_id: input.stripe_customer_id, stripe_payment_method_id: input.stripe_payment_method_id, provisioning_state: "pending", provisioning_attempts: 0, minutes_included: voicePlans[input.plan].minutes, minutes_used_current_period: 0, created_at: now() };
    db.voice_agents.push(voiceAgent);
    db.voice_steps.push(...blankVoiceSteps(voiceAgent.id, websitePrefill(db, owner, input.plan)));
    redeemCoupon(db, input.coupon_code, "voice", input.coupon_reservation_id, input.stripe_session_id);
    return { client: owner, voiceAgent };
  });
}

export async function voiceAgentForClient(clientId: string) { const db = await readDb(); return db.voice_agents.find((a) => a.client_id === clientId) || null; }
export async function voiceAgentForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const db = await readDb();
  const ownerIds = new Set(db.clients.filter((client) => client.email.toLowerCase() === normalized).map((client) => client.id));
  return db.voice_agents.find((agent) => ownerIds.has(agent.client_id)) || null;
}
export async function claimVoiceProvisioning(voiceAgentId: string, leaseMs = 2 * 60_000) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((a) => a.id === voiceAgentId);
    if (!agent) return { claimed: false, agent: null, leaseToken: null };
    if (agent.provisioning_state === "provisioned" && agent.provisioned_number && agent.twilio_number_sid && agent.vapi_assistant_id && agent.vapi_phone_number_id) return { claimed: false, agent, leaseToken: null };
    const expires = agent.provisioning_lease_expires_at ? new Date(agent.provisioning_lease_expires_at).getTime() : 0;
    if (agent.provisioning_state === "provisioning" && expires > Date.now()) return { claimed: false, agent, leaseToken: null };
    const leaseToken = uid("lease");
    agent.provisioning_state = "provisioning";
    agent.provisioning_started_at = now();
    agent.provisioning_lease_token = leaseToken;
    agent.provisioning_lease_expires_at = new Date(Date.now() + leaseMs).toISOString();
    agent.provisioning_attempts = (agent.provisioning_attempts || 0) + 1;
    agent.provisioning_error = undefined;
    return { claimed: true, agent, leaseToken };
  });
}
export async function setVoiceProvisioning(voiceAgentId: string, input: { provisioned_number?: string; twilio_number_sid?: string; vapi_phone_number_id?: string; vapi_assistant_id?: string; provisioning_state?: VoiceAgent["provisioning_state"]; provisioning_error?: string; lease_token?: string; renew_lease_ms?: number }) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((a) => a.id === voiceAgentId);
    if (!agent) return null;
    if (input.lease_token) {
      const leaseExpires = agent.provisioning_lease_expires_at ? new Date(agent.provisioning_lease_expires_at).getTime() : 0;
      if (input.lease_token !== agent.provisioning_lease_token || leaseExpires <= Date.now()) return null;
    }
    const { lease_token: _leaseToken, renew_lease_ms: renewLeaseMs, ...updates } = input;
    void _leaseToken;
    Object.assign(agent, updates);
    if (updates.provisioning_state && updates.provisioning_state !== "provisioning") {
      agent.provisioning_lease_token = undefined;
      agent.provisioning_lease_expires_at = undefined;
    } else if (renewLeaseMs !== undefined) {
      if (!Number.isFinite(renewLeaseMs) || renewLeaseMs <= 0) throw new Error("Provisioning lease renewal must be positive");
      agent.provisioning_lease_expires_at = new Date(Date.now() + renewLeaseMs).toISOString();
    }
    return agent;
  });
}
export async function saveVoiceStep(voiceAgentId: string, stepNumber: number, data: Record<string, unknown>, state: "draft" | "complete") {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((a) => a.id === voiceAgentId);
    const step = db.voice_steps.find((s) => s.voice_agent_id === voiceAgentId && s.step_number === stepNumber);
    if (!agent || !step) return null;
    step.data = data; step.state = state; step.updated_at = now();
    if (state === "complete") step.completed_at ||= step.updated_at;
    if (stepNumber === 6 && state === "complete" && data.recording_notice === false && !db.voice_audit_logs.some((log) => log.voice_agent_id === voiceAgentId && log.action === "recording_notice_disabled")) {
      db.voice_audit_logs.push({ id: uid("audit"), voice_agent_id: voiceAgentId, action: "recording_notice_disabled", detail: "Client completed voice intake with the recording notice disabled.", created_at: now() });
    }
    const complete = isAgentIntakeComplete(db.voice_steps.filter((s) => s.voice_agent_id === voiceAgentId));
    if (complete && ["paid", "in_progress"].includes(agent.status)) agent.status = "ready_to_build";
    else if (!complete && agent.status === "paid") agent.status = "in_progress";
    return { agent, step, complete };
  });
}

function liveReservations(db: PortalDb, couponCode: string, at = Date.now()) {
  return db.coupon_reservations.filter((r) => r.coupon_code === couponCode && r.status === "reserved" && new Date(r.expires_at).getTime() > at);
}

function expireReservations(db: PortalDb, at = Date.now()) {
  for (const reservation of db.coupon_reservations) {
    if (reservation.status === "reserved" && new Date(reservation.expires_at).getTime() <= at) reservation.status = "expired";
  }
}

function redeemCoupon(db: PortalDb, code: string | undefined, family: ProductFamily, reservationId: string | undefined, stripeSessionId: string) {
  if (!code) return;
  expireReservations(db);
  const coupon = db.coupons.find((item) => item.code === code.toLowerCase());
  if (!coupon) throw new Error("Coupon does not exist");
  if (reservationId) {
    const reservation = db.coupon_reservations.find((item) => item.id === reservationId && item.coupon_code === coupon.code && item.product_family === family);
    // A customer who paid before Stripe expired the session must still be fulfilled even
    // when webhook delivery arrives just after our short reservation lease elapsed.
    if (!reservation || reservation.status === "redeemed") throw new Error("Coupon reservation is no longer valid");
    reservation.status = "redeemed"; reservation.redeemed_at = now(); reservation.stripe_session_id = stripeSessionId;
  } else if (coupon.max_uses && coupon.uses + liveReservations(db, coupon.code).length >= coupon.max_uses) {
    throw new Error("Coupon has reached its use limit");
  }
  coupon.uses += 1;
}

export const COUPON_RESERVATION_TTL_MS = 30 * 60_000;
const COUPON_RATE_WINDOW_MS = 60 * 60_000;

function identityHash(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? crypto.createHash("sha256").update(normalized).digest("hex") : undefined;
}

export async function reserveCoupon(code: string, productFamily: ProductFamily, idempotencyKey: string, options: { ttlMs?: number; email?: string; ip?: string; emailLimit?: number; ipLimit?: number } = {}) {
  const normalized = code.trim().toLowerCase();
  return mutateDb((db) => {
    expireReservations(db);
    const existing = db.coupon_reservations.find((item) => item.idempotency_key === idempotencyKey);
    if (existing) return existing.status === "reserved" ? { ok: true as const, reservation: existing } : { ok: false as const, message: "That reservation can no longer be used." };
    const emailHash = identityHash(options.email);
    const ipHash = identityHash(options.ip);
    const windowStart = Date.now() - COUPON_RATE_WINDOW_MS;
    const recent = db.coupon_reservations.filter((item) => item.coupon_code === normalized && new Date(item.reserved_at).getTime() > windowStart);
    // Released and expired attempts still count during the short rate window, preventing
    // an attacker from cycling abandoned sessions to monopolize the public coupon.
    if (emailHash && recent.filter((item) => item.requester_email_hash === emailHash).length >= (options.emailLimit ?? 2)) return { ok: false as const, message: "Too many checkout attempts for this email. Please wait and try again." };
    if (ipHash && recent.filter((item) => item.requester_ip_hash === ipHash).length >= (options.ipLimit ?? 3)) return { ok: false as const, message: "Too many checkout attempts from this network. Please wait and try again." };
    const coupon = db.coupons.find((item) => item.code === normalized);
    if (!coupon || !coupon.active) return { ok: false as const, message: "That code is not active." };
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) return { ok: false as const, message: "That code has expired." };
    const validForProduct = productFamily === "voice" ? coupon.price_voice_setup : coupon.price_1page || coupon.price_3page || coupon.price_5page;
    if (!validForProduct) return { ok: false as const, message: `That code is not valid for ${productFamily}.` };
    if (coupon.max_uses && coupon.uses + liveReservations(db, coupon.code).length >= coupon.max_uses) return { ok: false as const, message: "That code has reached its use limit." };
    const ttlMs = options.ttlMs ?? COUPON_RESERVATION_TTL_MS;
    const reservation: CouponReservation = { id: uid("couponres"), coupon_code: coupon.code, product_family: productFamily, idempotency_key: idempotencyKey, status: "reserved", reserved_at: now(), expires_at: new Date(Date.now() + ttlMs).toISOString(), requester_email_hash: emailHash, requester_ip_hash: ipHash };
    db.coupon_reservations.push(reservation);
    return { ok: true as const, reservation };
  });
}

export async function releaseCouponReservation(reservationId: string) {
  return mutateDb((db) => {
    const reservation = db.coupon_reservations.find((item) => item.id === reservationId);
    if (reservation?.status === "reserved") reservation.status = "released";
    return reservation || null;
  });
}

export async function releaseCouponReservationForStripeObject(input: { reservationId?: string; stripeSessionId?: string }) {
  return mutateDb((db) => {
    const reservation = db.coupon_reservations.find((item) =>
      (input.reservationId && item.id === input.reservationId) || (input.stripeSessionId && item.stripe_session_id === input.stripeSessionId),
    );
    if (reservation?.status === "reserved") reservation.status = "released";
    return reservation || null;
  });
}

export async function resolveCoupon(code: string | undefined, plan: Plan) {
  const db = await readDb(); const normalized = (code || "").trim().toLowerCase();
  const list = { "1page": 59900, "3page": 99900, "5page": 149500 } as const;
  if (!normalized) return { ok: true as const, source: "direct" as Source, amount: list[plan] };
  const c = db.coupons.find((x) => x.code === normalized);
  if (!c) return { ok: false as const, message: "That code was not found." };
  if (!c.active) return { ok: false as const, message: "That code is no longer active." };
  if (c.expires_at && new Date(c.expires_at!).getTime() < Date.now()) return { ok: false as const, message: `That code expired on ${new Date(c.expires_at!).toLocaleDateString("en-CA")}.` };
  if (c.max_uses && c.uses + liveReservations(db, c.code).length >= c.max_uses) return { ok: false as const, message: "That code has reached its use limit." };
  const key = `price_${plan}` as keyof Coupon; const price = c[key] as number | undefined;
  if (!price) return { ok: false as const, message: "That code is not valid for this plan." };
  return { ok: true as const, source: c.source, amount: price, coupon: c.code };
}
export async function resolveVoiceSetupCoupon(code: string | undefined) {
  const db = await readDb(); const normalized = (code || "").trim().toLowerCase();
  if (!normalized) return { ok: true as const, source: "direct" as Source, amount: 49900 };
  const c = db.coupons.find((x) => x.code === normalized);
  if (!c) return { ok: false as const, message: "That code was not found." };
  if (!c.active) return { ok: false as const, message: "That code is no longer active." };
  if (c.expires_at && new Date(c.expires_at!).getTime() < Date.now()) return { ok: false as const, message: `That code expired on ${new Date(c.expires_at!).toLocaleDateString("en-CA")}.` };
  if (c.max_uses && c.uses + liveReservations(db, c.code).length >= c.max_uses) return { ok: false as const, message: "That code has reached its use limit." };
  if (!c.price_voice_setup) return { ok: false as const, message: "That code is not valid for voice-agent setup." };
  return { ok: true as const, source: c.source, amount: c.price_voice_setup, coupon: c.code };
}
export async function clientFromSession(token: string | undefined) {
  if (!token) return null; const db = await readDb();
  return db.clients.find((x) => x.session_token === token && (!x.session_expires_at || new Date(x.session_expires_at).getTime() > Date.now()) && x.status !== "suspended") || null;
}
export async function createPortalSession(magic: string) {
  return mutateDb((db) => { const c = db.clients.find((x) => x.magic_token === magic && new Date(x.token_expires_at).getTime() > Date.now() && x.status !== "suspended"); if (!c) return null; c.session_token = magicToken(); c.session_expires_at = new Date(Date.now() + 30 * 864e5).toISOString(); return c; });
}
export async function rotateMagicLink(email: string) {
  return mutateDb((db) => { const c = db.clients.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.status !== "suspended"); if (!c) return null; c.magic_token = magicToken(); c.token_expires_at = new Date(Date.now() + 180 * 864e5).toISOString(); return c; });
}
export async function saveAsset(asset: Asset) { return mutateDb((db) => { db.assets.push(asset); return asset; }); }
export async function setVoiceStatus(voiceAgentId: string, status: VoiceAgent["status"]) {
  return mutateDb((db) => { const agent = db.voice_agents.find((x) => x.id === voiceAgentId); if (!agent) return null; agent.status = status; if (status === "live") agent.live_at ||= now(); if (status === "cancelled") { agent.cancelled_at ||= now(); agent.records_retention_status = "retained_for_export_and_support"; } return agent; });
}
export async function setVoiceBillingStatus(voiceAgentId: string, status: string) {
  return mutateDb((db) => { const agent = db.voice_agents.find((x) => x.id === voiceAgentId); if (!agent) return null; agent.stripe_subscription_status = status; return agent; });
}
export async function setStatus(clientId: string, status: ClientStatus, note?: string) { return mutateDb((db) => { const c = db.clients.find((x) => x.id === clientId); if (!c) return null; c.status = status; if (status === "live") c.launched_at ||= now(); if (note !== undefined) c.internal_note = note; return c; }); }
export async function addRevision(clientId: string, notes: string): Promise<Revision> { return mutateDb((db) => { const round = db.revisions.filter((r) => r.client_id === clientId).length + 1; const r = { id: uid("rev"), client_id: clientId, round, requested_at: now(), notes }; db.revisions.push(r); const c = db.clients.find((x) => x.id === clientId); if (c) c.status = "revising"; return r; }); }
export async function addVoiceRevision(voiceAgentId: string, notes: string) { return mutateDb((db) => { const round = db.voice_revisions.filter((r) => r.voice_agent_id === voiceAgentId).length + 1; const revision = { id: uid("voicerev"), voice_agent_id: voiceAgentId, round, requested_at: now(), notes }; db.voice_revisions.push(revision); const agent = db.voice_agents.find((item) => item.id === voiceAgentId); if (agent) agent.status = "revising"; return revision; }); }
export async function saveCallRecord(call: PortalDb["call_records"][number]) { return mutateDb((db) => { const existing = db.call_records.find((item) => item.vapi_call_id === call.vapi_call_id); if (existing) return existing; db.call_records.push(call); return call; }); }

export async function claimVoiceTestCall(input: { voice_agent_id: string; idempotency_key: string; destination: string; at?: Date; cooldown_ms?: number; daily_limit?: number }) {
  return mutateDb((db) => {
    const at = input.at || new Date();
    const existing = db.test_call_attempts.find((item) => item.voice_agent_id === input.voice_agent_id && item.idempotency_key === input.idempotency_key);
    if (existing) return { ok: false as const, reason: "duplicate" as const, attempt: existing };
    // Count every provider attempt, including apparent failures: the provider may have
    // accepted a call before our request failed, so excluding failures re-opens the dialer.
    const active = db.test_call_attempts.filter((item) => item.voice_agent_id === input.voice_agent_id);
    const latest = active.reduce((max, item) => Math.max(max, new Date(item.created_at).getTime()), 0);
    if (latest && at.getTime() - latest < (input.cooldown_ms ?? 5 * 60_000)) return { ok: false as const, reason: "cooldown" as const };
    const dayAgo = at.getTime() - 24 * 60 * 60_000;
    if (active.filter((item) => new Date(item.created_at).getTime() > dayAgo).length >= (input.daily_limit ?? 3)) return { ok: false as const, reason: "quota" as const };
    const attempt = { id: uid("testcall"), voice_agent_id: input.voice_agent_id, idempotency_key: input.idempotency_key, destination: input.destination, status: "pending" as const, created_at: at.toISOString() };
    db.test_call_attempts.push(attempt);
    return { ok: true as const, attempt };
  });
}

export async function finishVoiceTestCall(attemptId: string, result: { vapi_call_id?: string; error?: string }) {
  return mutateDb((db) => {
    const attempt = db.test_call_attempts.find((item) => item.id === attemptId);
    if (!attempt) return null;
    if (result.vapi_call_id) { attempt.status = "started"; attempt.vapi_call_id = result.vapi_call_id; attempt.error = undefined; }
    else { attempt.status = "failed"; attempt.error = result.error || "Provider call failed"; }
    return attempt;
  });
}
export async function markVoiceLeadSent(vapiCallId: string) { return mutateDb((db) => { const call = db.call_records.find((item) => item.vapi_call_id === vapiCallId); if (!call) return null; call.lead_sent_at ||= now(); return call; }); }
export async function saveUsageAlert(alert: PortalDb["usage_alerts"][number]) { return mutateDb((db) => { const existing = db.usage_alerts.find((item) => item.voice_agent_id === alert.voice_agent_id && item.period_start === alert.period_start && item.threshold === alert.threshold); if (existing) return existing; db.usage_alerts.push(alert); return alert; }); }
export async function markUsageAlertSent(voiceAgentId: string, periodStart: string, threshold: 80 | 100) { return mutateDb((db) => { const alert = db.usage_alerts.find((item) => item.voice_agent_id === voiceAgentId && item.period_start === periodStart && item.threshold === threshold); if (alert) alert.sent_at ||= now(); return alert || null; }); }
export async function claimNotification(scope: string, key: string) {
  const token = uid("notification");
  return mutateDb((db) => {
    const existing = db.idempotency_records.find((item) => item.scope === `notification:${scope}` && item.key === key);
    if (existing) return { claimed: false as const, token: null };
    db.idempotency_records.push({ scope: `notification:${scope}`, key, resource_id: token, created_at: now() });
    return { claimed: true as const, token };
  });
}
export async function releaseNotificationClaim(scope: string, key: string, token: string) {
  return mutateDb((db) => {
    const index = db.idempotency_records.findIndex((item) => item.scope === `notification:${scope}` && item.key === key && item.resource_id === token);
    if (index < 0) return false;
    db.idempotency_records.splice(index, 1);
    return true;
  });
}
export async function recordIdempotency(scope: string, key: string, resourceId?: string) { return mutateDb((db) => { const existing = db.idempotency_records.find((item) => item.scope === scope && item.key === key); if (existing) return { created: false, record: existing }; const record = { scope, key, resource_id: resourceId, created_at: now() }; db.idempotency_records.push(record); return { created: true, record }; }); }
export async function releaseIdempotency(scope: string, key: string) { return mutateDb((db) => { const before = db.idempotency_records.length; db.idempotency_records = db.idempotency_records.filter((item) => item.scope !== scope || item.key !== key); return before !== db.idempotency_records.length; }); }

export async function setVoicePackage(voiceAgentId: string, manifest: Record<string, string>) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((item) => item.id === voiceAgentId);
    if (!agent) return null;
    agent.package_manifest ||= manifest;
    agent.package_generated_at ||= now();
    if (["ready_to_build", "revising"].includes(agent.status)) agent.status = "building";
    return agent;
  });
}

export async function markVoicePackageNotified(voiceAgentId: string) {
  return mutateDb((db) => { const agent = db.voice_agents.find((item) => item.id === voiceAgentId); if (!agent) return null; agent.package_notified_at ||= now(); return agent; });
}

function nextMonthlyPeriod(start: Date) {
  const next = new Date(start);
  const desiredDay = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const daysInTargetMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(desiredDay, daysInTargetMonth));
  return next;
}

export async function recordVoiceSubscription(voiceAgentId: string, subscription: { id: string; status: string; period_start: string; period_end: string }) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((item) => item.id === voiceAgentId);
    if (!agent) return null;
    if (agent.stripe_subscription_id && agent.stripe_subscription_id !== subscription.id) throw new Error("A different subscription is already attached");
    agent.stripe_subscription_id = subscription.id;
    agent.stripe_subscription_status = subscription.status;
    agent.period_start ||= subscription.period_start;
    agent.period_end ||= subscription.period_end;
    agent.usage_period_start ||= subscription.period_start;
    agent.usage_period_end ||= nextMonthlyPeriod(new Date(agent.usage_period_start)).toISOString();
    agent.approved_at ||= now();
    agent.go_live_state = "binding_pending";
    agent.go_live_error = undefined;
    return agent;
  });
}

export async function markVoiceGoLiveBindingFailed(voiceAgentId: string, error: string) {
  return mutateDb((db) => { const agent = db.voice_agents.find((item) => item.id === voiceAgentId); if (!agent) return null; agent.go_live_state = "binding_failed"; agent.go_live_error = error; return agent; });
}

export async function finalizeVoiceApproval(voiceAgentId: string, subscription: { id: string; status: string; period_start: string; period_end: string }) {
  await recordVoiceSubscription(voiceAgentId, subscription);
  return mutateDb((db) => {
    const agent = db.voice_agents.find((item) => item.id === voiceAgentId);
    if (!agent) return null;
    agent.live_at ||= now();
    agent.status = "live";
    agent.go_live_state = "live";
    agent.go_live_error = undefined;
    return agent;
  });
}

export async function scheduleVoiceCancellation(voiceAgentId: string, effectiveAt: string) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((item) => item.id === voiceAgentId);
    if (!agent) return null;
    if (agent.status === "cancelled") return agent;
    agent.status = "cancellation_pending";
    agent.cancellation_requested_at ||= now();
    agent.cancellation_effective_at = effectiveAt;
    return agent;
  });
}

export async function completeVoiceCancellation(subscriptionId: string) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((item) => item.stripe_subscription_id === subscriptionId);
    if (!agent) return null;
    agent.status = "cancelled";
    agent.stripe_subscription_status = "canceled";
    agent.cancelled_at ||= now();
    agent.records_retention_status = "retained_for_export_and_support";
    if (!agent.provider_unbound_at) agent.provider_cleanup_status = "pending";
    return agent;
  });
}

export async function markVoiceProviderCleanup(voiceAgentId: string, result: { completed: boolean; error?: string }) {
  return mutateDb((db) => {
    const agent = db.voice_agents.find((item) => item.id === voiceAgentId);
    if (!agent) return null;
    agent.provider_cleanup_status = result.completed ? "completed" : "failed";
    agent.provider_cleanup_error = result.completed ? undefined : result.error || "Provider cleanup failed";
    if (result.completed) agent.provider_unbound_at ||= now();
    return agent;
  });
}

export async function recordVoiceCallAndUsage(call: PortalDb["call_records"][number]) {
  return mutateDb((db) => {
    const existing = db.call_records.find((item) => item.vapi_call_id === call.vapi_call_id);
    const agent = db.voice_agents.find((item) => item.id === call.voice_agent_id);
    if (!agent) throw new Error("Voice agent not found");
    if (existing?.duration_s) {
      const pending = db.usage_alerts.filter((item) => item.voice_agent_id === agent.id && item.period_start === agent.usage_period_start && !item.sent_at).map((item) => item.threshold);
      return { created: false, call: existing, agent, thresholds: pending.length ? [Math.max(...pending) as 80 | 100] : [] };
    }
    if (existing) Object.assign(existing, call);
    else db.call_records.push(call);
    if (!["live", "cancellation_pending"].includes(agent.status)) return { created: true, call, agent, thresholds: [] as (80 | 100)[] };
    const at = new Date(call.started_at);
    let periodStart = agent.usage_period_start ? new Date(agent.usage_period_start) : at;
    let periodEnd = agent.usage_period_end ? new Date(agent.usage_period_end) : nextMonthlyPeriod(periodStart);
    while (at >= periodEnd) { periodStart = periodEnd; periodEnd = nextMonthlyPeriod(periodStart); }
    if (agent.usage_period_start !== periodStart.toISOString()) {
      agent.usage_period_start = periodStart.toISOString(); agent.usage_period_end = periodEnd.toISOString(); agent.minutes_used_current_period = 0;
    }
    agent.minutes_used_current_period += call.duration_s / 60;
    const ratio = agent.minutes_included ? agent.minutes_used_current_period / agent.minutes_included * 100 : 0;
    const crossed = ([80, 100] as const).filter((threshold) => ratio >= threshold && !db.usage_alerts.some((item) => item.voice_agent_id === agent.id && item.period_start === agent.usage_period_start && item.threshold === threshold));
    // A call can jump across both boundaries; send only the highest newly crossed notice.
    const thresholds = crossed.length ? [Math.max(...crossed) as 80 | 100] : [];
    for (const threshold of thresholds) db.usage_alerts.push({ id: uid("usage"), voice_agent_id: agent.id, period_start: agent.usage_period_start!, threshold });
    if (ratio >= 100 && !agent.first_overage_forgiven_at) agent.first_overage_forgiven_at = now();
    return { created: true, call, agent, thresholds };
  });
}

export async function generateBuildPackage(db: PortalDb, clientId: string) {
  const c = db.clients.find((x) => x.id === clientId); if (!c || c.build_package_generated_at) return;
  const steps = db.steps.filter((s) => s.client_id === clientId).sort((a, b) => a.step_number - b.step_number);
  const assets = db.assets.filter((a) => a.client_id === clientId);
  const lines = [`# Build brief — ${c.business_name}`, "", `Plan: ${c.plan}`, `Source: ${c.source}`, `Paid: $${((c.amount_paid || 0) / 100).toFixed(2)} CAD`, `Preview: https://digitalbuilders.ca/preview/${c.preview_slug}`, "", c.mx_preflight_required ? "**MX PREFLIGHT REQUIRED — client receives email on this domain. Do not change DNS until mail is mapped.**" : "", "", "## Steps"];
  for (const s of steps) lines.push("", `### Step ${s.step_number}`, "```json", JSON.stringify(s.data, null, 2), "```");
  lines.push("", "## Assets", ...assets.map((a, i) => `${i + 1}. ${a.category}: ${a.original_filename} (${a.storage_key})`));
  const pkgDir = path.join(root(), "packages"); await mkdir(pkgDir, { recursive: true }); const file = path.join(pkgDir, `${c.id}-brief.md`); await writeFile(file, lines.join("\n")); c.build_package_generated_at = now(); c.build_package_path = file;
}
export async function assetRoot() { const dir = path.join(root(), "assets"); await mkdir(dir, { recursive: true }); return dir; }
export async function copyUploadedAsset(tempPath: string, clientId: string, filename: string) { const key = `${clientId}/${uid("asset")}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`; const out = path.join(await assetRoot(), key); await mkdir(path.dirname(out), { recursive: true }); await cp(tempPath, out); return key; }
