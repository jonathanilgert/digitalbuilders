import Database from "better-sqlite3";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { PortalDb } from "./types";

const localLocks = new Map<string, Promise<unknown>>();

export function portalDataRoot() {
  return process.env.PORTAL_DATA_DIR || path.join(process.cwd(), ".portal-data");
}

export function portalSqlitePath() {
  return path.join(portalDataRoot(), "portal.sqlite3");
}

export function legacyPortalJsonPath() {
  return path.join(portalDataRoot(), "portal.json");
}

function openDatabase() {
  const db = new Database(portalSqlitePath());
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 10000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS portal_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS portal_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS unique_claims (
      scope TEXT NOT NULL,
      value TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      PRIMARY KEY (scope, value)
    );
  `);
  return db;
}

function claims(state: PortalDb): Array<[string, string, string]> {
  const rows: Array<[string, string, string]> = [];
  for (const client of state.clients) {
    if (client.stripe_session_id) rows.push(["website_stripe_session", client.stripe_session_id, client.id]);
  }
  for (const agent of state.voice_agents) {
    if (agent.setup_stripe_session_id) rows.push(["voice_setup_stripe_session", agent.setup_stripe_session_id, agent.id]);
    if (agent.twilio_number_sid) rows.push(["twilio_number_sid", agent.twilio_number_sid, agent.id]);
    if (agent.vapi_phone_number_id) rows.push(["vapi_phone_number_id", agent.vapi_phone_number_id, agent.id]);
    if (agent.vapi_assistant_id) rows.push(["vapi_assistant_id", agent.vapi_assistant_id, agent.id]);
    if (agent.stripe_subscription_id) rows.push(["voice_stripe_subscription", agent.stripe_subscription_id, agent.id]);
  }
  for (const call of state.call_records) rows.push(["vapi_call_id", call.vapi_call_id, call.id]);
  for (const item of state.coupon_reservations) rows.push(["coupon_reservation_key", item.idempotency_key, item.id]);
  for (const item of state.idempotency_records) rows.push([`idempotency:${item.scope}`, item.key, item.resource_id || item.key]);
  return rows;
}

function persist(db: Database.Database, state: PortalDb) {
  db.prepare("UPDATE portal_state SET payload = ?, updated_at = ? WHERE id = 1").run(JSON.stringify(state), new Date().toISOString());
  db.prepare("DELETE FROM unique_claims").run();
  const insert = db.prepare("INSERT INTO unique_claims(scope, value, owner_id) VALUES (?, ?, ?)");
  for (const row of claims(state)) insert.run(...row);
}

export async function initializePortalDb(empty: () => PortalDb, normalize: (input: Partial<PortalDb>) => PortalDb): Promise<{ imported: boolean; sqlitePath: string }> {
  await mkdir(portalDataRoot(), { recursive: true });
  const db = openDatabase();
  try {
    db.exec("BEGIN IMMEDIATE");
    const existing = db.prepare("SELECT 1 FROM portal_state WHERE id = 1").get();
    if (existing) {
      db.exec("COMMIT");
      return { imported: false, sqlitePath: portalSqlitePath() };
    }
    let state = empty();
    let imported = false;
    if (existsSync(legacyPortalJsonPath())) {
      state = normalize(JSON.parse(await readFile(legacyPortalJsonPath(), "utf8")) as Partial<PortalDb>);
      imported = true;
    }
    db.prepare("INSERT INTO portal_state(id, payload, updated_at) VALUES (1, ?, ?)").run(JSON.stringify(state), new Date().toISOString());
    db.prepare("INSERT OR REPLACE INTO portal_meta(key, value) VALUES ('legacy_json_imported', ?)").run(imported ? new Date().toISOString() : "none");
    persist(db, state);
    db.exec("COMMIT");
    return { imported, sqlitePath: portalSqlitePath() };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

export async function readPortalState(empty: () => PortalDb, normalize: (input: Partial<PortalDb>) => PortalDb): Promise<PortalDb> {
  await initializePortalDb(empty, normalize);
  const db = openDatabase();
  try {
    const row = db.prepare("SELECT payload FROM portal_state WHERE id = 1").get() as { payload: string };
    return normalize(JSON.parse(row.payload) as Partial<PortalDb>);
  } finally {
    db.close();
  }
}

async function locked<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = localLocks.get(key) || Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const current = previous.then(() => gate);
  localLocks.set(key, current);
  await previous;
  try { return await operation(); }
  finally {
    release();
    if (localLocks.get(key) === current) localLocks.delete(key);
  }
}

export async function transactPortalState<T>(empty: () => PortalDb, normalize: (input: Partial<PortalDb>) => PortalDb, fn: (state: PortalDb) => T | Promise<T>): Promise<T> {
  await initializePortalDb(empty, normalize);
  return locked(portalSqlitePath(), async () => {
    const db = openDatabase();
    try {
      db.exec("BEGIN IMMEDIATE");
      const row = db.prepare("SELECT payload FROM portal_state WHERE id = 1").get() as { payload: string };
      const state = normalize(JSON.parse(row.payload) as Partial<PortalDb>);
      const result = await fn(state);
      persist(db, state);
      db.exec("COMMIT");
      return result;
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    } finally {
      db.close();
    }
  });
}

export async function replacePortalState(state: PortalDb, empty: () => PortalDb, normalize: (input: Partial<PortalDb>) => PortalDb) {
  return transactPortalState(empty, normalize, (current) => {
    for (const key of Object.keys(current) as Array<keyof PortalDb>) delete current[key];
    Object.assign(current, normalize(state));
  });
}
