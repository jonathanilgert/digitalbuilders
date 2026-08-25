import { mkdir, readFile, writeFile, cp, stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Asset, Client, ClientStatus, Coupon, Plan, PortalDb, Revision, Source, StepData } from "./types";
import { stepMeta } from "./types";

const root = process.env.PORTAL_DATA_DIR || path.join(process.cwd(), ".portal-data");
const dbPath = path.join(root, "portal.json");
const locks = new Map<string, Promise<unknown>>();

function now() { return new Date().toISOString(); }
export function uid(prefix = "id") { return `${prefix}_${crypto.randomBytes(12).toString("hex")}`; }
export function magicToken() { return crypto.randomBytes(32).toString("base64url"); }
export function slugify(input: string) { return (input || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "website"; }

function seedCoupons(): Coupon[] {
  const expires = new Date(Date.now() + 30 * 864e5).toISOString();
  return ["truetrades26", "dirtlink26", "stroll26", "direct26"].map((code) => ({
    code,
    source: code.replace("26", "") as Source,
    price_1page: 34900,
    price_3page: 59900,
    price_5page: 99500,
    expires_at: expires,
    uses: 0,
    active: true,
  }));
}

async function ensureDb() {
  await mkdir(root, { recursive: true });
  try { await stat(dbPath); } catch { await writeFile(dbPath, JSON.stringify({ clients: [], steps: [], assets: [], revisions: [], coupons: seedCoupons() }, null, 2)); }
}
export async function readDb(): Promise<PortalDb> { await ensureDb(); return JSON.parse(await readFile(dbPath, "utf8")); }
export async function writeDb(db: PortalDb) { await ensureDb(); await writeFile(dbPath, JSON.stringify(db, null, 2)); }
export async function mutateDb<T>(fn: (db: PortalDb) => T | Promise<T>): Promise<T> {
  const key = dbPath;
  const prior = locks.get(key) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => (release = resolve));
  locks.set(key, prior.then(() => next));
  await prior;
  try { const db = await readDb(); const result = await fn(db); await writeDb(db); return result; }
  finally { release(); if (locks.get(key) === next) locks.delete(key); }
}

export function blankSteps(clientId: string): StepData[] { return stepMeta.map((s) => ({ client_id: clientId, step_number: s.number, data: {}, state: "not_started", updated_at: now() })); }
export function isIntakeComplete(steps: StepData[]) { return stepMeta.every((s) => steps.find((x) => x.step_number === s.number)?.state === "complete"); }
export async function updateClientStatusFromSteps(clientId: string, db: PortalDb) {
  const client = db.clients.find((c) => c.id === clientId); if (!client) return;
  const complete = isIntakeComplete(db.steps.filter((s) => s.client_id === clientId));
  if (complete && ["paid", "in_progress"].includes(client.status)) {
    client.status = "ready_to_build";
    client.completed_at ||= now();
    await generateBuildPackage(db, clientId);
  } else if (!complete && client.status === "paid") client.status = "in_progress";
}
export async function createPaidClient(input: { source: Source; coupon_code?: string; plan: Plan; amount_paid: number; stripe_session_id: string; business_name: string; contact_name: string; email: string; phone: string; }): Promise<Client> {
  return mutateDb(async (db) => {
    const existing = db.clients.find((c) => c.stripe_session_id === input.stripe_session_id);
    if (existing) return existing;
    const id = uid("client");
    const business = input.business_name || "New website";
    const client: Client = { id, ...input, magic_token: magicToken(), token_expires_at: new Date(Date.now() + 180 * 864e5).toISOString(), status: "paid", preview_slug: slugify(business), created_at: now() };
    db.clients.push(client); db.steps.push(...blankSteps(id));
    if (input.coupon_code) { const c = db.coupons.find((x) => x.code === input.coupon_code); if (c) c.uses += 1; }
    return client;
  });
}
export async function resolveCoupon(code: string | undefined, plan: Plan) {
  const db = await readDb(); const normalized = (code || "").trim().toLowerCase();
  const list = { "1page": 59900, "3page": 99900, "5page": 149500 } as const;
  if (!normalized) return { ok: true as const, source: "direct" as Source, amount: list[plan] };
  const c = db.coupons.find((x) => x.code === normalized);
  if (!c) return { ok: false as const, message: "That code was not found." };
  if (!c.active) return { ok: false as const, message: "That code is no longer active." };
  if (new Date(c.expires_at).getTime() < Date.now()) return { ok: false as const, message: `That code expired on ${new Date(c.expires_at).toLocaleDateString("en-CA")}.` };
  if (c.max_uses && c.uses >= c.max_uses) return { ok: false as const, message: "That code has reached its use limit." };
  const key = `price_${plan}` as keyof Coupon; const price = c[key] as number | undefined;
  if (!price) return { ok: false as const, message: "That code is not valid for this plan." };
  return { ok: true as const, source: c.source, amount: price, coupon: c.code };
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
export async function setStatus(clientId: string, status: ClientStatus, note?: string) { return mutateDb((db) => { const c = db.clients.find((x) => x.id === clientId); if (!c) return null; c.status = status; if (status === "live") c.launched_at ||= now(); if (note !== undefined) c.internal_note = note; return c; }); }
export async function addRevision(clientId: string, notes: string): Promise<Revision> { return mutateDb((db) => { const round = db.revisions.filter((r) => r.client_id === clientId).length + 1; const r = { id: uid("rev"), client_id: clientId, round, requested_at: now(), notes }; db.revisions.push(r); const c = db.clients.find((x) => x.id === clientId); if (c) c.status = "revising"; return r; }); }

export async function generateBuildPackage(db: PortalDb, clientId: string) {
  const c = db.clients.find((x) => x.id === clientId); if (!c || c.build_package_generated_at) return;
  const steps = db.steps.filter((s) => s.client_id === clientId).sort((a, b) => a.step_number - b.step_number);
  const assets = db.assets.filter((a) => a.client_id === clientId);
  const lines = [`# Build brief — ${c.business_name}`, "", `Plan: ${c.plan}`, `Source: ${c.source}`, `Paid: $${(c.amount_paid / 100).toFixed(2)} CAD`, `Preview: https://digitalbuilders.ca/preview/${c.preview_slug}`, "", c.mx_preflight_required ? "**MX PREFLIGHT REQUIRED — client receives email on this domain. Do not change DNS until mail is mapped.**" : "", "", "## Steps"];
  for (const s of steps) lines.push("", `### Step ${s.step_number}`, "```json", JSON.stringify(s.data, null, 2), "```");
  lines.push("", "## Assets", ...assets.map((a, i) => `${i + 1}. ${a.category}: ${a.original_filename} (${a.storage_key})`));
  const pkgDir = path.join(root, "packages"); await mkdir(pkgDir, { recursive: true }); const file = path.join(pkgDir, `${c.id}-brief.md`); await writeFile(file, lines.join("\n")); c.build_package_generated_at = now(); c.build_package_path = file;
}
export async function assetRoot() { const dir = path.join(root, "assets"); await mkdir(dir, { recursive: true }); return dir; }
export async function copyUploadedAsset(tempPath: string, clientId: string, filename: string) { const key = `${clientId}/${uid("asset")}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`; const out = path.join(await assetRoot(), key); await mkdir(path.dirname(out), { recursive: true }); await cp(tempPath, out); return key; }
