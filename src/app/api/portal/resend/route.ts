import { NextResponse } from "next/server";
import { rotateMagicLink } from "@/lib/portal/store";
import { sendMagicLink } from "@/lib/portal/mail";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const client = await rotateMagicLink(email);
  if (client) await sendMagicLink(client);
  return NextResponse.redirect(new URL("/portal?sent=1", req.url), 303);
}
