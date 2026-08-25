import { NextResponse } from "next/server";
import type { Plan } from "@/lib/portal/types";
import { plans } from "@/lib/portal/types";
import { resolveCoupon } from "@/lib/portal/store";

export async function POST(req: Request) {
  const body = await req.json();
  const plan = String(body.plan || "1page") as Plan;
  if (!plans[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const resolved = await resolveCoupon(String(body.coupon || ""), plan);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: 400 });
  return NextResponse.json({ amount: resolved.amount, source: resolved.source, coupon: "coupon" in resolved ? resolved.coupon : undefined });
}
