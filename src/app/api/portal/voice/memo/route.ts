import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { mutateDb, voiceAgentForClient } from "@/lib/portal/store";
import { putVoiceMedia } from "@/lib/voice/media-storage";

export const runtime = "nodejs";
const MAX_BYTES = 25 * 1024 * 1024;
const allowed = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/ogg", "audio/aac"]);

function extension(type: string, filename = "") {
  const known = ({ "audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-m4a": "m4a", "audio/ogg": "ogg", "audio/aac": "aac" } as Record<string, string>)[type];
  return known || filename.match(/\.(webm|m4a|mp4|mp3|wav|ogg|aac)$/i)?.[1]?.toLowerCase() || "audio";
}

function contentTypeForExtension(ext: string) {
  return ({ webm: "audio/webm", m4a: "audio/mp4", mp4: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac" } as Record<string, string>)[ext] || "application/octet-stream";
}

async function transcribe(file: File) {
  const key = process.env.VOICE_TRANSCRIPTION_API_KEY || process.env.OPENAI_API_KEY;
  const configured = process.env.VOICE_TRANSCRIPTION_ENDPOINT || process.env.OPENAI_BASE_URL || (key ? "https://api.openai.com/v1" : "");
  if (!key) return { transcript: undefined, transcription: "unavailable" as const, message: "Transcription is unavailable right now. Your recording was saved and you can type or edit the notes below." };
  const endpoint = configured.endsWith("/audio/transcriptions") ? configured : `${configured.replace(/\/$/, "")}/audio/transcriptions`;
  const form = new FormData();
  form.set("file", file, file.name || `memo.${extension(file.type, file.name)}`);
  form.set("model", process.env.VOICE_TRANSCRIPTION_MODEL || "whisper-1");
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`transcription endpoint returned ${response.status}`);
    const result = await response.json() as { text?: unknown };
    if (typeof result.text !== "string") throw new Error("transcription endpoint returned no text");
    return { transcript: result.text, transcription: "complete" as const };
  } catch (error) {
    console.error("Voice memo transcription failed", error);
    return { transcript: undefined, transcription: "unavailable" as const, message: "Your recording was saved, but transcription is temporarily unavailable. You can type notes below." };
  }
}

export async function POST(req: Request) {
  const client = await requireClient();
  const agent = await voiceAgentForClient(client.id);
  if (!agent) return NextResponse.json({ error: "Voice agent not found" }, { status: 404 });
  const requestBytes = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(requestBytes) && requestBytes > MAX_BYTES + 1024 * 1024) return NextResponse.json({ error: "Choose an audio file smaller than 25 MB." }, { status: 413 });
  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "The audio upload could not be read." }, { status: 400 }); }
  const file = form.get("audio");
  const step = Number(form.get("step"));
  const duration = Number(form.get("duration_s") || 0);
  if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) return NextResponse.json({ error: "Choose an audio file smaller than 25 MB." }, { status: 400 });
  const mime = file.type.split(";")[0].toLowerCase();
  if (!allowed.has(mime) && !file.name.match(/\.(webm|m4a|mp4|mp3|wav|ogg|aac)$/i)) return NextResponse.json({ error: "That audio format is not supported." }, { status: 415 });
  if (![4, 6].includes(step)) return NextResponse.json({ error: "Invalid memo step" }, { status: 400 });
  const id = `memo_${crypto.randomBytes(12).toString("hex")}`;
  const ext = extension(mime, file.name);
  const storageKey = `${agent.id}/${id}.${ext}`;
  try {
    await putVoiceMedia(storageKey, new Uint8Array(await file.arrayBuffer()), allowed.has(mime) ? mime : contentTypeForExtension(ext));
  } catch (error) {
    console.error("Voice memo storage failed", error);
    return NextResponse.json({ error: "Recording storage is unavailable right now. Nothing was saved; please retry or type your notes below." }, { status: 503 });
  }
  const transcription = await transcribe(file);
  await mutateDb((db) => {
    db.voice_memos.push({ id, voice_agent_id: agent.id, step_number: step, storage_key: storageKey, duration_s: Number.isFinite(duration) && duration > 0 ? Math.min(duration, 3600) : undefined, transcript: transcription.transcript, transcribed_at: transcription.transcript ? new Date().toISOString() : undefined, created_at: new Date().toISOString() });
  });
  return NextResponse.json({ ok: true, id, playbackUrl: `/api/portal/voice/memo/${id}`, ...transcription });
}
