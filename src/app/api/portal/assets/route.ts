import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireClient } from "@/lib/portal/auth";
import { assetRoot, saveAsset, uid } from "@/lib/portal/store";
import type { AssetCategory } from "@/lib/portal/types";

export async function POST(req: Request) {
  const client = await requireClient();
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const category = String(form.get("category") || "other") as AssetCategory;
  for (const file of files.slice(0, 25)) {
    if (file.size > 15 * 1024 * 1024) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    const storage_key = `${client.id}/${uid("asset")}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const out = path.join(await assetRoot(), storage_key);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, bytes);
    await saveAsset({ id: uid("asset"), client_id: client.id, storage_key, original_filename: file.name, category, kind: "uploaded", bytes: bytes.length, created_at: new Date().toISOString() });
  }
  return NextResponse.redirect(new URL("/portal/step/2", req.url), 303);
}
