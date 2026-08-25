import { NextResponse } from "next/server";
import type { Plan } from "@/lib/portal/types";
import { plans } from "@/lib/portal/types";
import { resolveCoupon } from "@/lib/portal/store";
import { stripe } from "@/lib/portal/stripe";

export async function POST(req: Request) {
  const form = await req.formData();
  const plan = String(form.get("plan") || "1page") as Plan;
  if (!plans[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const resolved = await resolveCoupon(String(form.get("coupon") || ""), plan);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: 400 });
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET before enabling paid portal access." }, { status: 503 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const session = await s.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/portal?sent=1`,
    cancel_url: `${origin}/portal/start`,
    customer_email: String(form.get("email") || ""),
    metadata: {
      plan,
      source: resolved.source,
      coupon_code: "coupon" in resolved ? resolved.coupon || "" : "",
      business_name: String(form.get("business_name") || ""),
      contact_name: String(form.get("contact_name") || ""),
      phone: String(form.get("phone") || ""),
    },
    line_items: [{ price_data: { currency: "cad", unit_amount: resolved.amount, product_data: { name: `Digital Builders ${plans[plan].name}` } }, quantity: 1 }],
  });
  return NextResponse.redirect(session.url!, 303);
}
