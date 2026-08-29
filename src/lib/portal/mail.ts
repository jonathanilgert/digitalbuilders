import { site } from "@/lib/content";
import type { Client } from "./types";
import { publicOrigin } from "./urls";

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
  const base = publicOrigin();
  return `${base}/portal/${client.magic_token}`;
}
export async function sendMagicLink(client: Client) {
  return sendMail(client.email, "Your Digital Builders portal link", `Hi ${client.contact_name || "there"},\n\nYour website portal is ready. Open your magic link here:\n${portalLink(client)}\n\nNo password is needed.\n\nDigital Builders`);
}
export async function notifyReady(client: Client) {
  const base = publicOrigin();
  const packageLink = `${base}/admin/package/${client.id}`;
  const adminLink = `${base}/admin`;
  const assetFolder = `${process.env.PORTAL_DATA_DIR || ".portal-data"}/assets/${client.id}`;

  return sendMail(
    process.env.PORTAL_NOTIFY_EMAIL || site.inquiriesEmail,
    `${client.business_name} is ready to build`,
    `${client.business_name} completed all six portal steps.\n\n` +
      `Build brief: ${packageLink}\n` +
      `Admin dashboard: ${adminLink}\n` +
      `Uploaded files folder: ${assetFolder}\n` +
      `Server package path: ${client.build_package_path || "pending"}\n` +
      `Preview slug: ${client.preview_slug}`,
  );
}
