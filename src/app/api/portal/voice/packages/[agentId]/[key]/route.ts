import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { packageDownloadResponse } from "@/lib/voice/package-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string; key: string }> },
) {
  const client = await requireClient();
  const { agentId, key } = await params;
  const db = await readDb();
  return packageDownloadResponse(client.id, agentId, key, db);
}
