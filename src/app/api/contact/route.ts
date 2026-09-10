import { NextResponse } from "next/server";
import { z } from "zod";
import { site } from "@/lib/content";
import { sendMail } from "@/lib/portal/mail";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  projectType: z.string().trim().max(120).optional().default("Not specified"),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional().default(""),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please check the form fields" }, { status: 400 });
  }

  // Quietly accept honeypot submissions without sending an email.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "Email service unavailable" }, { status: 503 });
  }

  const { name, email, projectType, message } = parsed.data;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Project type: ${projectType || "Not specified"}`,
    "",
    message,
  ].join("\n");

  try {
    await sendMail(site.email, `New website enquiry from ${name}`, text, { replyTo: email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form delivery failed", error);
    return NextResponse.json({ ok: false, error: "Unable to send message" }, { status: 502 });
  }
}
