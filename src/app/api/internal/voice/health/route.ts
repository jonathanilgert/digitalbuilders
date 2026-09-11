import { NextResponse } from "next/server";
import { readDb } from "@/lib/portal/store";

export async function GET() {
  try {
    await readDb();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Portal database health check failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
