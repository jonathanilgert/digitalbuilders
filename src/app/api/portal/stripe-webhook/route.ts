import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import type { Plan, Source } from "@/lib/portal/types";
import { createPaidClient } from "@/lib/portal/store";
import { sendMagicLink } from "@/lib/portal/mail";
import { stripe } from "@/lib/portal/stripe";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  const raw = await req.text();
  const sig = (await headers()).get("stripe-signature");
  let event: Stripe.Event;
  try { event = s.webhooks.constructEvent(raw, sig || "", secret); }
  catch (err) { return NextResponse.json({ error: `Webhook signature failed: ${err instanceof Error ? err.message : "unknown"}` }, { status: 400 }); }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const m = session.metadata || {};
    const client = await createPaidClient({
      source: (m.source || "direct") as Source,
      coupon_code: m.coupon_code || undefined,
      plan: (m.plan || "1page") as Plan,
      amount_paid: session.amount_total || 0,
      stripe_session_id: session.id,
      business_name: m.business_name || "New website",
      contact_name: m.contact_name || "",
      email: session.customer_details?.email || session.customer_email || "",
      phone: m.phone || session.customer_details?.phone || "",
    });
    await sendMagicLink(client);
  }
  return NextResponse.json({ received: true });
}
