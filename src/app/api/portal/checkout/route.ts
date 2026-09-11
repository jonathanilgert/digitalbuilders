import { NextResponse } from "next/server";
import type { Plan } from "@/lib/portal/types";
import { plans } from "@/lib/portal/types";
import { resolveCoupon, websiteClientForEmail } from "@/lib/portal/store";
import { stripe } from "@/lib/portal/stripe";
import { publicOrigin } from "@/lib/portal/urls";

export async function POST(req: Request) {
  const form = await req.formData();
  const plan = String(form.get("plan") || "1page") as Plan;
  if (!plans[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!email || await websiteClientForEmail(email)) return NextResponse.json({ error: "This email already has a website purchase. Contact us if you need another site." }, { status: 409 });
  const resolved = await resolveCoupon(String(form.get("coupon") || ""), plan);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: 400 });
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET before enabling paid portal access." }, { status: 503 });
  const origin = publicOrigin(req);
  const session = await s.checkout.sessions.create({
    mode: "payment",
    integration_identifier: "digitalbuilders_dkqzjwna",
    success_url: `${origin}/portal?checkout=success`,
    cancel_url: `${origin}/portal/start`,
    customer_email: email,
    metadata: {
      product_family: "website",
      expected_amount: String(resolved.amount),
      plan,
      source: resolved.source,
      coupon_code: "coupon" in resolved ? resolved.coupon || "" : "",
      business_name: String(form.get("business_name") || ""),
      contact_name: String(form.get("contact_name") || ""),
      phone: String(form.get("phone") || ""),
    },
    line_items: [{ price_data: { currency: "cad", unit_amount: resolved.amount, product_data: { name: `Digital Builders ${plans[plan].name}`, tax_code: "txcd_10000000" } }, quantity: 1 }],
  });
  return NextResponse.redirect(session.url!, 303);
}
