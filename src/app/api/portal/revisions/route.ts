import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { addRevision } from "@/lib/portal/store";

export async function POST(req: Request) {
  const client = await requireClient();
  const form = await req.formData();
  await addRevision(client.id, String(form.get("notes") || ""));
  return NextResponse.redirect(new URL("/portal/dashboard", req.url), 303);
}
