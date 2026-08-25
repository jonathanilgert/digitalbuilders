import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/portal/store";
import { portalCookie, secureCookie } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.url;
  const client = await createPortalSession(token);
  if (!client) return NextResponse.redirect(new URL("/portal?error=That magic link is invalid or expired.", origin), 303);
  const jar = await cookies();
  jar.set(portalCookie, client.session_token!, { httpOnly: true, sameSite: "lax", secure: await secureCookie(), path: "/", maxAge: 60 * 60 * 24 * 30 });
  return NextResponse.redirect(new URL("/portal/dashboard", origin), 303);
}
