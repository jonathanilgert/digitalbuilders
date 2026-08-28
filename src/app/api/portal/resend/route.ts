import { NextResponse } from "next/server";
import { rotateMagicLink } from "@/lib/portal/store";
import { sendMagicLink } from "@/lib/portal/mail";
import { publicUrl } from "@/lib/portal/urls";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const client = await rotateMagicLink(email);
  if (client) await sendMagicLink(client);
  return NextResponse.redirect(publicUrl("/portal?sent=1", req), 303);
}
