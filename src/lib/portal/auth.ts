import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientFromSession } from "./store";

export const portalCookie = "db_portal_session";
export const adminCookie = "db_admin_session";

export async function secureCookie() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto");
  return process.env.NODE_ENV === "production" && proto !== "http";
}

export function adminSessionValue() {
  const token = process.env.PORTAL_ADMIN_TOKEN;
  if (!token) return null;
  return crypto.createHmac("sha256", token).update("digitalbuilders-admin-session-v1").digest("base64url");
}

export async function requireClient() {
  const jar = await cookies();
  const token = jar.get(portalCookie)?.value;
  const client = await clientFromSession(token);
  if (!client) redirect("/portal");
  return client;
}

export async function adminAuthed() {
  const expected = adminSessionValue();
  if (!expected) return false;
  const jar = await cookies();
  const actual = jar.get(adminCookie)?.value || "";
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function requireAdmin() {
  if (!(await adminAuthed())) redirect("/admin/login");
}
