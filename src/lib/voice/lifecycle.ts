import type Stripe from "stripe";
import { voicePlans, type VoiceAgent } from "@/lib/portal/types";

const VAPI_BASE = "https://api.vapi.ai";

function requireVapiKey() {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) throw new Error("Vapi is not configured");
  return key;
}

async function vapiRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${VAPI_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${requireVapiKey()}`, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: init.signal || AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Vapi request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function startVoiceTestCall(agent: VoiceAgent, destination: string) {
  if (process.env.VOICE_PROVIDER_MUTATIONS_ENABLED !== "true") throw new Error("Provider mutations are disabled");
  if (!agent.vapi_assistant_id || !agent.vapi_phone_number_id) throw new Error("The test agent is not provisioned yet");
  return vapiRequest<{ id: string; status?: string }>("/call/phone", {
    method: "POST",
    body: JSON.stringify({ assistantId: agent.vapi_assistant_id, phoneNumberId: agent.vapi_phone_number_id, customer: { number: destination } }),
  });
}

export async function bindVoicePhone(agent: VoiceAgent) {
  if (!agent.vapi_assistant_id || !agent.vapi_phone_number_id) throw new Error("The agent phone binding is incomplete");
  if (process.env.VOICE_PROVIDER_MUTATIONS_ENABLED !== "true") throw new Error("Provider mutations are disabled");
  return vapiRequest<{ id: string }>(`/phone-number/${encodeURIComponent(agent.vapi_phone_number_id)}`, {
    method: "PATCH",
    body: JSON.stringify({ assistantId: agent.vapi_assistant_id }),
  });
}

export async function unbindVoicePhone(agent: VoiceAgent) {
  if (!agent.vapi_phone_number_id) return null;
  if (process.env.VOICE_PROVIDER_MUTATIONS_ENABLED !== "true") throw new Error("Provider mutations are disabled");
  return vapiRequest<{ id: string }>(`/phone-number/${encodeURIComponent(agent.vapi_phone_number_id)}`, {
    method: "PATCH",
    body: JSON.stringify({ assistantId: null }),
  });
}

function nextPeriod(start: Date, interval: VoiceAgent["billing_interval"]) {
  const end = new Date(start);
  if (interval === "year") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

export async function createVoiceSubscription(s: Stripe, agent: VoiceAgent) {
  if (!agent.stripe_customer_id || !agent.stripe_payment_method_id) throw new Error("The setup payment did not save a reusable payment method");
  const plan = voicePlans[agent.plan];
  const envKey = `VOICE_PRICE_${agent.plan.replace("voice_", "").toUpperCase()}_${agent.billing_interval.toUpperCase()}`;
  let priceId = process.env[envKey];
  if (!priceId) {
    const lookupKey = `digitalbuilders_${agent.plan}_${agent.billing_interval}_cad`;
    const existing = await s.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    priceId = existing.data[0]?.id;
    if (!priceId) {
      const products = await s.products.list({ active: true, limit: 100 });
      let product = products.data.find((item) => item.metadata.voice_plan === agent.plan);
      if (!product) product = await s.products.create({ name: `Digital Builders AI Voice Agent — ${plan.name}`, metadata: { product_family: "voice", voice_plan: agent.plan } }, { idempotencyKey: `voice-product-${agent.plan}` });
      try {
        const price = await s.prices.create({ currency: "cad", unit_amount: agent.billing_interval === "year" ? plan.annual : plan.monthly, recurring: { interval: agent.billing_interval }, product: product.id, lookup_key: lookupKey, transfer_lookup_key: true, metadata: { voice_plan: agent.plan } }, { idempotencyKey: `voice-price-${agent.plan}-${agent.billing_interval}` });
        priceId = price.id;
      } catch (error) {
        const recovered = await s.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
        if (!recovered.data[0]) throw error;
        priceId = recovered.data[0].id;
      }
    }
  }
  const start = new Date();
  const subscription = await s.subscriptions.create({
    customer: agent.stripe_customer_id,
    default_payment_method: agent.stripe_payment_method_id,
    collection_method: "charge_automatically",
    payment_behavior: "error_if_incomplete",
    items: [{ price: priceId, quantity: 1 }],
    metadata: { product_family: "voice", voice_agent_id: agent.id, plan: agent.plan },
  }, { idempotencyKey: `voice-go-live-${agent.id}` });
  const item = subscription.items.data[0];
  const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : start;
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : nextPeriod(periodStart, agent.billing_interval);
  return { subscription, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() };
}
