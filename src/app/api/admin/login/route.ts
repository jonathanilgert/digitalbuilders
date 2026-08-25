import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminCookie, adminSessionValue, secureCookie } from "@/lib/portal/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  const value = adminSessionValue();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.url;
  if (!token || !value || token !== process.env.PORTAL_ADMIN_TOKEN) {
    return NextResponse.redirect(new URL("/admin/login", origin), 303);
  }
  const jar = await cookies();
  jar.set(adminCookie, value, { httpOnly: true, sameSite: "lax", secure: await secureCookie(), path: "/", maxAge: 60 * 60 * 12 });
  return NextResponse.redirect(new URL("/admin", origin), 303);
}
