import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import { rotateMagicLink, setStatus } from "@/lib/portal/store";
import { sendMagicLink } from "@/lib/portal/mail";
import type { ClientStatus } from "@/lib/portal/types";
import { publicUrl } from "@/lib/portal/urls";

export async function POST(req: Request) {
  await requireAdmin();
  const form = await req.formData();
  const action = String(form.get("action") || "");
  const clientId = String(form.get("client_id") || "");
  if (action === "status") await setStatus(clientId, String(form.get("status")) as ClientStatus, String(form.get("note") || ""));
  if (action === "resend") { const email = String(form.get("email") || ""); const c = await rotateMagicLink(email); if (c) await sendMagicLink(c); }
  return NextResponse.redirect(publicUrl("/admin", req), 303);
}
