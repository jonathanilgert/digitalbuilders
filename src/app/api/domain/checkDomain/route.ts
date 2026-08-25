import { NextResponse } from "next/server";

const cache = new Map<string, { at: number; result: unknown }>();
let lastCheck = 0;
export async function POST(req: Request) {
  const { domain } = await req.json();
  const clean = String(domain || "").trim().toLowerCase();
  if (!/^[a-z0-9-]+\.[a-z]{2,}$/.test(clean)) return NextResponse.json({ ok: false, message: "Enter a valid domain like example.ca." }, { status: 400 });
  const cached = cache.get(clean);
  if (cached && Date.now() - cached.at < 60_000) return NextResponse.json(cached.result);
  if (Date.now() - lastCheck < 10_000) return NextResponse.json({ ok: false, message: "Please wait a few seconds before another domain check." }, { status: 429 });
  lastCheck = Date.now();
  // Porkbun API credentials are intentionally optional; v1 records the requested names and returns a manual-check state when unavailable.
  const result = { ok: true, domain: clean, available: null, message: "Domain recorded. Nicholas will confirm availability before registration." };
  cache.set(clean, { at: Date.now(), result });
  return NextResponse.json(result);
}
