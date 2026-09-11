import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import type { Plan, Source, VoicePlan } from "@/lib/portal/types";
import { completeVoiceCancellation, createPaidClient, createPaidVoiceAgent, markVoiceProviderCleanup, readDb, releaseCouponReservationForStripeObject, setVoiceBillingStatus, voiceAgentForEmail, websiteClientForEmail } from "@/lib/portal/store";
import { sendMagicLink, sendMail } from "@/lib/portal/mail";
import { stripe } from "@/lib/portal/stripe";
import { unbindVoicePhone } from "@/lib/voice/lifecycle";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  const raw = await req.text();
  const sig = (await headers()).get("stripe-signature");
  let event: Stripe.Event;
  try { event = s.webhooks.constructEvent(raw, sig || "", secret); }
  catch (err) { return NextResponse.json({ error: `Webhook signature failed: ${err instanceof Error ? err.message : "unknown"}` }, { status: 400 }); }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await releaseCouponReservationForStripeObject({ reservationId: session.metadata?.coupon_reservation_id, stripeSessionId: session.id });
    return NextResponse.json({ received: true, coupon_released: true });
  }
  if (event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await releaseCouponReservationForStripeObject({ reservationId: paymentIntent.metadata?.coupon_reservation_id });
    return NextResponse.json({ received: true, coupon_released: true });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "unpaid") return NextResponse.json({ received: true, deferred: true });
    const m = session.metadata || {};
    if (m.product_family === "voice") {
      const validPlans: VoicePlan[] = ["voice_afterhours", "voice_frontdesk", "voice_pro"];
      const validSources: Source[] = ["truetrades", "stroll", "dirtlink", "direct", "referral"];
      const plan = m.plan as VoicePlan;
      const source = m.source as Source;
      const expectedAmount = Number(m.setup_amount);
      const email = session.customer_details?.email || session.customer_email || "";
      if (!validPlans.includes(plan) || !validSources.includes(source) || !email || session.currency !== "cad" || !Number.isInteger(expectedAmount) || session.amount_total !== expectedAmount || (process.env.NODE_ENV === "production" && !session.livemode)) return NextResponse.json({ error: "Invalid voice checkout fulfillment data" }, { status: 400 });
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      const paymentIntent = paymentIntentId ? await s.paymentIntents.retrieve(paymentIntentId) : null;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const paymentMethodId = typeof paymentIntent?.payment_method === "string" ? paymentIntent.payment_method : paymentIntent?.payment_method?.id;
      if (!paymentIntentId || !customerId || !paymentMethodId) return NextResponse.json({ error: "Voice checkout did not save the required payment authorization" }, { status: 503 });
      const existingForOwner = await voiceAgentForEmail(email);
      if (existingForOwner && existingForOwner.setup_stripe_session_id !== session.id) {
        await s.refunds.create({ payment_intent: paymentIntentId, reason: "duplicate" }, { idempotencyKey: `duplicate-voice-checkout-${session.id}` });
        await sendMail(email, "Duplicate voice-agent setup refunded", "We found an existing Digital Builders voice-agent setup for this email, so this duplicate setup payment was refunded automatically. Reply to hello@digitalbuilders.ca if you intended to add another business.");
        return NextResponse.json({ received: true, duplicate_refunded: true });
      }
      const { client } = await createPaidVoiceAgent({
        source,
        coupon_code: m.coupon_code || undefined,
        coupon_reservation_id: m.coupon_reservation_id || undefined,
        plan,
        billing_interval: m.billing_interval === "year" ? "year" : "month",
        amount_paid: session.amount_total || 0,
        stripe_session_id: session.id,
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethodId,
        business_name: m.business_name || "New voice agent",
        contact_name: m.contact_name || "",
        email,
        phone: m.phone || session.customer_details?.phone || "",
      });
      await sendMagicLink(client);
      return NextResponse.json({ received: true });
    }
    const validPlans: Plan[] = ["1page", "3page", "5page"];
    const validSources: Source[] = ["truetrades", "stroll", "dirtlink", "direct", "referral"];
    const plan = m.plan as Plan;
    const source = m.source as Source;
    const email = (session.customer_details?.email || session.customer_email || "").trim().toLowerCase();
    const expectedAmount = Number(m.expected_amount);
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    // Accept checkout sessions created by the immediately previous release, which did not
    // carry expected_amount, while still validating all server-authored identity fields.
    const amountValid = m.expected_amount ? Number.isInteger(expectedAmount) && session.amount_total === expectedAmount : Number.isInteger(session.amount_total) && (session.amount_total || 0) > 0;
    if (!validPlans.includes(plan) || !validSources.includes(source) || !email || session.currency !== "cad" || !amountValid || !paymentIntentId || (process.env.NODE_ENV === "production" && !session.livemode)) return NextResponse.json({ error: "Invalid website checkout fulfillment data" }, { status: 400 });
    const existingWebsite = await websiteClientForEmail(email);
    if (existingWebsite && existingWebsite.stripe_session_id !== session.id) {
      await s.refunds.create({ payment_intent: paymentIntentId, reason: "duplicate" }, { idempotencyKey: `duplicate-website-checkout-${session.id}` });
      await sendMail(email, "Duplicate website purchase refunded", "We found an existing Digital Builders website purchase for this email, so this duplicate payment was refunded automatically. Contact us if you intended to order another website.");
      return NextResponse.json({ received: true, duplicate_refunded: true });
    }
    let client;
    try {
      client = await createPaidClient({ source, coupon_code: m.coupon_code || undefined, plan, amount_paid: session.amount_total || 0, stripe_session_id: session.id, business_name: m.business_name || "New website", contact_name: m.contact_name || "", email, phone: m.phone || session.customer_details?.phone || "" });
    } catch (error) {
      // A race after checkout preflight must never leave a paid, unfulfilled order.
      await s.refunds.create({ payment_intent: paymentIntentId, reason: "requested_by_customer", metadata: { fulfillment_error: error instanceof Error ? error.message.slice(0, 400) : "unknown" } }, { idempotencyKey: `failed-website-fulfillment-${session.id}` });
      await sendMail(email, "Website payment refunded", "We could not attach this payment to a new website order, so it was refunded automatically. Contact us and we will help place the order safely.");
      return NextResponse.json({ received: true, fulfillment_refunded: true });
    }
    await sendMagicLink(client);
  }
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const db = await readDb();
    const agent = db.voice_agents.find((item) => item.stripe_subscription_id === subscription.id);
    if (agent) {
      await completeVoiceCancellation(subscription.id);
      let providerCleanedUp = false;
      if (process.env.VOICE_PROVIDER_MUTATIONS_ENABLED === "true") {
        try { await unbindVoicePhone(agent); await markVoiceProviderCleanup(agent.id, { completed: true }); providerCleanedUp = true; }
        catch (error) { await markVoiceProviderCleanup(agent.id, { completed: false, error: error instanceof Error ? error.message : "Provider cleanup failed" }); console.error("Voice provider cleanup failed", error); }
      }
      const owner = db.clients.find((item) => item.id === agent.client_id);
      if (owner) await sendMail(owner.email, "Your voice-agent service has ended", `Your paid service period has ended. ${providerCleanedUp ? "Inbound routing has been disconnected." : "Provider routing cleanup is pending with our staff."} Your intake and call records remain available for export. Contact us if you need help porting or restoring the number.`);
    }
  }
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionValue = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof subscriptionValue === "string" ? subscriptionValue : subscriptionValue?.id;
    if (subscriptionId) {
      const db = await readDb();
      const agent = db.voice_agents.find((item) => item.stripe_subscription_id === subscriptionId);
      if (agent) {
        await setVoiceBillingStatus(agent.id, "payment_failed");
        const owner = db.clients.find((item) => item.id === agent.client_id);
        if (owner) await sendMail(owner.email, "Action needed for your voice-agent payment", "Stripe could not collect your latest voice-agent payment. Calls are not being interrupted immediately. Please reply to this email so we can update billing before service is affected.");
      }
    }
  }
  return NextResponse.json({ received: true });
}
