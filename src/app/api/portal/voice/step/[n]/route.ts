import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { markVoicePackageNotified, readDb, recordIdempotency, releaseIdempotency, saveVoiceStep, setVoicePackage, voiceAgentForClient } from "@/lib/portal/store";
import { hasLeadDestination, parseVoiceStep } from "@/lib/voice/intake-schema";
import { generateAndStoreVoicePackage } from "@/lib/voice/package-service";
import { sendMail, portalLink } from "@/lib/portal/mail";
import { site } from "@/lib/content";

async function authenticatedStep(n: number) {
  const client = await requireClient();
  if (!Number.isInteger(n) || n < 1 || n > 6) return { error: NextResponse.json({ error: "Invalid step" }, { status: 400 }) };
  const agent = await voiceAgentForClient(client.id);
  if (!agent) return { error: NextResponse.json({ error: "Voice agent not found" }, { status: 404 }) };
  return { client, agent };
}

export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const auth = await authenticatedStep(n);
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const step = db.voice_steps.find((item) => item.voice_agent_id === auth.agent.id && item.step_number === n);
  if (!step) return NextResponse.json({ error: "Voice step not found" }, { status: 404 });
  return NextResponse.json({ data: step.data, state: step.state });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const auth = await authenticatedStep(n);
  if ("error" in auth) return auth.error;
  const { client, agent } = auth;
  if (Number(req.headers.get("content-length") || 0) > 100_000) return NextResponse.json({ error: "Step data is too large" }, { status: 413 });
  let body: { data?: unknown; state?: unknown };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "Malformed JSON" }, { status: 400 }); }
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return NextResponse.json({ error: "Invalid step data" }, { status: 400 });
  const parsed = parseVoiceStep(n, body.data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 400 });
  if (JSON.stringify(parsed.data).length > 100_000) return NextResponse.json({ error: "Step data is too large" }, { status: 413 });
  const state = body.state === "complete" ? "complete" : "draft";
  if (state === "complete" && !client.business_name.trim()) return NextResponse.json({ error: "Add your business name before completing intake." }, { status: 400 });
  if (n === 5 && state === "complete" && !hasLeadDestination(parsed.data)) return NextResponse.json({ error: "Add at least one phone number or email for lead delivery." }, { status: 400 });
  if (n === 6 && state === "complete" && parsed.data.ai_disclosure_acknowledged !== true) return NextResponse.json({ error: "Please acknowledge the AI disclosure policy before completing this step." }, { status: 400 });
  const result = await saveVoiceStep(agent.id, n, parsed.data, state);
  if (!result) return NextResponse.json({ error: "Voice step not found" }, { status: 404 });
  let packageReady = Boolean(result.agent.package_generated_at);
  if (result.complete && !packageReady) {
    try {
      const db = await readDb();
      const generated = await generateAndStoreVoicePackage({ client, agent: result.agent, steps: db.voice_steps.filter((item) => item.voice_agent_id === agent.id) });
      const manifest = Object.fromEntries(generated.artifacts.map((artifact) => [artifact.key, artifact.storageKey]));
      await setVoicePackage(agent.id, manifest);
      packageReady = true;
      const notice = await recordIdempotency("voice-package-ready-notice", agent.id, agent.id);
      if (notice.created) {
        try {
          const links = generated.artifacts.map((artifact) => `${artifact.filename}: /api/portal/voice/packages/${agent.id}/${artifact.key}`).join("\n");
          await Promise.all([
            sendMail(client.email, "Your voice-agent intake is complete", `Hi ${client.contact_name || "there"},\n\nWe received all six steps and are preparing your test agent. We’ll let you know as soon as your test call is ready.\n\nPortal: ${portalLink(client)}\n\nDigital Builders`),
            sendMail(process.env.PORTAL_NOTIFY_EMAIL || site.inquiriesEmail, `${client.business_name} voice package is ready`, `${client.business_name} completed voice intake.\n\n${links}`),
          ]);
          await markVoicePackageNotified(agent.id);
        } catch (error) { await releaseIdempotency("voice-package-ready-notice", agent.id); throw error; }
      }
    } catch (error) { console.error("Voice package generation failed", error); }
  }
  return NextResponse.json({ ok: true, state, complete: result.complete, package_ready: packageReady, status: result.agent.status, data: parsed.data });
}
