import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { setStatus } from "@/lib/portal/store";
import { sendMail } from "@/lib/portal/mail";
import { site } from "@/lib/content";
import { publicUrl } from "@/lib/portal/urls";

export async function GET(req: Request) {
  const client = await requireClient();
  await setStatus(client.id, "live");
  await sendMail(process.env.PORTAL_NOTIFY_EMAIL || site.inquiriesEmail, `${client.business_name} approved go-live`, `${client.business_name} approved the preview. Connect the domain and launch.`);
  return NextResponse.redirect(publicUrl("/portal/dashboard", req), 303);
}
