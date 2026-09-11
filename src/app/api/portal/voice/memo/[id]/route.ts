import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { readDb } from "@/lib/portal/store";
import { getVoiceMedia } from "@/lib/voice/media-storage";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await requireClient();
  const id = (await params).id;
  const db = await readDb();
  const agentIds = new Set(db.voice_agents.filter((agent) => agent.client_id === client.id).map((agent) => agent.id));
  const memo = db.voice_memos.find((item) => item.id === id && agentIds.has(item.voice_agent_id));
  if (!memo) return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  try {
    const bytes = await getVoiceMedia(memo.storage_key);
    const ext = memo.storage_key.split(".").pop()?.toLowerCase();
    const contentType = ({ webm: "audio/webm", m4a: "audio/mp4", mp4: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac" } as Record<string, string>)[ext || ""] || "application/octet-stream";
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new NextResponse(body, { headers: { "Content-Type": contentType, "Content-Length": String(bytes.byteLength), "Cache-Control": "private, max-age=3600", "Content-Disposition": "inline" } });
  } catch {
    return NextResponse.json({ error: "Recording is unavailable" }, { status: 404 });
  }
}
