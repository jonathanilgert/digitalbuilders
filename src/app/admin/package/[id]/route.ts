import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { requireAdmin } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = await readDb();
  const c = db.clients.find((x) => x.id === id);
  if (!c?.build_package_path) notFound();
  const body = await readFile(c.build_package_path, "utf8");
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${c.preview_slug}-build-brief.md"` } });
}
