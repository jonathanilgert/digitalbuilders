import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { stripe } from "@/lib/portal/stripe";
import { publicOrigin } from "@/lib/portal/urls";
import { COUPON_RESERVATION_TTL_MS, releaseCouponReservation, reserveCoupon, resolveVoiceSetupCoupon, voiceAgentForEmail } from "@/lib/portal/store";
import { voicePlans, type VoicePlan } from "@/lib/portal/types";

export async function POST(req: Request) {
  if (process.env.VOICE_AGENT_CHECKOUT_ENABLED !== "true") return NextResponse.json({ error: "Voice-agent checkout is not open yet. Email hello@digitalbuilders.ca and we will reserve your founding-client spot." }, { status: 503 });
  const form = await req.formData();
  const plan = String(form.get("plan") || "voice_frontdesk") as VoicePlan;
  if (!voicePlans[plan]) return NextResponse.json({ error: "Invalid voice plan" }, { status: 400 });
  const businessName = String(form.get("business_name") || "").trim();
  const contactName = String(form.get("contact_name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const phone = String(form.get("phone") || "").trim();
  if (!businessName || !email || !email.includes("@")) return NextResponse.json({ error: "Business name and a valid email are required." }, { status: 400 });
  if (await voiceAgentForEmail(email)) return NextResponse.json({ error: "A voice-agent setup already exists for this email. Use your portal link or ask us to resend it." }, { status: 409 });
  const billingInterval = form.get("billing_interval") === "year" ? "year" : "month";
  const resolved = await resolveVoiceSetupCoupon(String(form.get("coupon") || ""));
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: 400 });
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  const checkoutKey = `voice-setup-${crypto.createHash("sha256").update(`${email}|${businessName.toLowerCase()}|${plan}|${billingInterval}|${"coupon" in resolved ? resolved.coupon || "" : ""}`).digest("hex")}`;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const requestIp = forwarded || req.headers.get("x-real-ip") || undefined;
  const reservation = "coupon" in resolved && resolved.coupon ? await reserveCoupon(resolved.coupon, "voice", checkoutKey, { email, ip: requestIp }) : null;
  if (reservation && !reservation.ok) return NextResponse.json({ error: reservation.message }, { status: 409 });
  const reservationId = reservation?.ok ? reservation.reservation.id : "";
  const origin = publicOrigin(req);
  try {
    const session = await s.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      integration_identifier: "digitalbuilders_dkqzjwna",
      success_url: `${origin}/portal?checkout=voice-success`,
      cancel_url: `${origin}/portal/voice/start?plan=${plan}`,
      expires_at: Math.floor((Date.now() + COUPON_RESERVATION_TTL_MS + 60_000) / 1000),
      customer_email: email,
      payment_intent_data: { setup_future_usage: "off_session", metadata: { coupon_reservation_id: reservationId } },
      metadata: { product_family: "voice", plan, billing_interval: billingInterval, setup_amount: String(resolved.amount), source: resolved.source, coupon_code: "coupon" in resolved ? resolved.coupon || "" : "", coupon_reservation_id: reservationId, business_name: businessName, contact_name: contactName, phone },
      line_items: [{ price_data: { currency: "cad", unit_amount: resolved.amount, product_data: { name: "Digital Builders AI voice agent setup", tax_code: "txcd_10000000" } }, quantity: 1 }],
    }, { idempotencyKey: checkoutKey });
    return NextResponse.redirect(session.url!, 303);
  } catch (error) {
    if (reservationId) await releaseCouponReservation(reservationId);
    throw error;
  }
}
