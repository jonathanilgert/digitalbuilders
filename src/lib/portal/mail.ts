import { site } from "@/lib/content";
import type { Client } from "./types";

export async function sendMail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.PORTAL_EMAIL_FROM || `Digital Builders <${site.inquiriesEmail}>`;
  if (!key) {
    console.log(`[email disabled] to=${to} subject=${subject}\n${text}`);
    return { skipped: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  return res.json();
}
export function portalLink(client: Client) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  return `${base}/portal/${client.magic_token}`;
}
export async function sendMagicLink(client: Client) {
  return sendMail(client.email, "Your Digital Builders portal link", `Hi ${client.contact_name || "there"},\n\nYour website portal is ready. Open your magic link here:\n${portalLink(client)}\n\nNo password is needed.\n\nDigital Builders`);
}
export async function notifyReady(client: Client) {
  return sendMail(process.env.PORTAL_NOTIFY_EMAIL || site.inquiriesEmail, `${client.business_name} is ready to build`, `${client.business_name} completed all six portal steps.\n\nPackage: ${client.build_package_path || "pending"}\nPreview slug: ${client.preview_slug}`);
}
