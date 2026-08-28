import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { addRevision } from "@/lib/portal/store";
import { publicUrl } from "@/lib/portal/urls";

export async function POST(req: Request) {
  const client = await requireClient();
  const form = await req.formData();
  await addRevision(client.id, String(form.get("notes") || ""));
  return NextResponse.redirect(publicUrl("/portal/dashboard", req), 303);
}
