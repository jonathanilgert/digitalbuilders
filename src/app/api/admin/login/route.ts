import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminCookie, adminSessionValue, secureCookie } from "@/lib/portal/auth";
import { publicUrl } from "@/lib/portal/urls";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  const value = adminSessionValue();
  if (!token || !value || token !== process.env.PORTAL_ADMIN_TOKEN) {
    return NextResponse.redirect(publicUrl("/admin/login", req), 303);
  }
  const jar = await cookies();
  jar.set(adminCookie, value, { httpOnly: true, sameSite: "lax", secure: await secureCookie(), path: "/", maxAge: 60 * 60 * 12 });
  return NextResponse.redirect(publicUrl("/admin", req), 303);
}
