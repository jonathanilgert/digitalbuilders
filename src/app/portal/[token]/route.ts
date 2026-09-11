import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPortalSession, readDb, voiceAgentForClient } from "@/lib/portal/store";
import { portalCookie, secureCookie } from "@/lib/portal/auth";
import { publicUrl } from "@/lib/portal/urls";

export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await createPortalSession(token);
  if (!client) return NextResponse.redirect(publicUrl("/portal?error=That magic link is invalid or expired.", req), 303);
  const jar = await cookies();
  jar.set(portalCookie, client.session_token!, { httpOnly: true, sameSite: "lax", secure: await secureCookie(), path: "/", maxAge: 60 * 60 * 24 * 30 });
  const voiceAgent = await voiceAgentForClient(client.id);
  const db = await readDb();
  const hasWebsite = db.steps.some((step) => step.client_id === client.id);
  const destination = voiceAgent && hasWebsite ? "/portal/products" : voiceAgent ? "/portal/voice/dashboard" : "/portal/dashboard";
  return NextResponse.redirect(publicUrl(destination, req), 303);
}
