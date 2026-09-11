import { createHash } from "node:crypto";
import { generateVoiceAgentPackage, type Carrier, type RoutingMode, type VoicePackageInput } from "./package";
import { getVoiceMedia, putVoiceMedia } from "./media-storage";

export type PackageClient = { id?: string; business_name: string };
export type PackageAgent = { id: string; client_id?: string; provisioned_number?: string };
export type PackageStep = {
  voice_agent_id?: string;
  step_number: number;
  data: Record<string, unknown>;
  state: string;
};

export const VOICE_PACKAGE_ARTIFACTS = {
  assistant: { filename: "assistant.json", contentType: "application/json; charset=utf-8" },
  knowledge: { filename: "knowledge.md", contentType: "text/markdown; charset=utf-8" },
  forwarding: { filename: "forwarding.md", contentType: "text/markdown; charset=utf-8" },
  forwardingPdf: { filename: "forwarding.pdf", contentType: "application/pdf" },
  brief: { filename: "agent-brief.md", contentType: "text/markdown; charset=utf-8" },
  briefPdf: { filename: "agent-brief.pdf", contentType: "application/pdf" },
} as const;

export type VoicePackageArtifactKey = keyof typeof VOICE_PACKAGE_ARTIFACTS;
export type VoicePackageArtifactMetadata = {
  key: VoicePackageArtifactKey;
  filename: string;
  contentType: string;
  storageKey: string;
  bytes: number;
  sha256: string;
};
export type GeneratedVoicePackage = {
  agentId: string;
  packageSha256: string;
  generatedAt: string;
  reused: boolean;
  artifacts: VoicePackageArtifactMetadata[];
};

type StoredManifest = Omit<GeneratedVoicePackage, "reused"> & { version: 1 };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const VOICES: Record<string, string> = {
  warm_clear: "Savannah",
  calm_professional: "Elliot",
  bright_friendly: "Kylie",
  steady_confident: "Rohan",
};

function safeAgentId(agentId: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(agentId)) throw new Error("Invalid voice agent id.");
  return agentId;
}

export function isVoicePackageArtifactKey(value: string): value is VoicePackageArtifactKey {
  return Object.prototype.hasOwnProperty.call(VOICE_PACKAGE_ARTIFACTS, value);
}

export function voicePackageStorageKey(agentId: string, artifact: VoicePackageArtifactKey): string {
  return `packages/${safeAgentId(agentId)}/${VOICE_PACKAGE_ARTIFACTS[artifact].filename}`;
}

function manifestStorageKey(agentId: string): string {
  return `packages/${safeAgentId(agentId)}/manifest.json`;
}

function string(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned || undefined;
}

function list(value: unknown): string[] | undefined {
  const values = Array.isArray(value)
    ? value.flatMap((item) => typeof item === "string" ? [item] : [])
    : typeof value === "string" ? value.split(/[\n,]/) : [];
  const cleaned = values.map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned : undefined;
}

function numeric(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function faqs(value: unknown): VoicePackageInput["faqs"] {
  if (Array.isArray(value)) {
    const parsed = value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const question = string(record.question);
      const answer = string(record.answer);
      return question && answer ? [{ question, answer }] : [];
    });
    return parsed.length ? parsed : undefined;
  }
  const text = string(value);
  if (!text) return undefined;
  const parsed = text.split("\n").flatMap((line) => {
    const separator = line.includes("|") ? "|" : line.includes(":") ? ":" : "";
    if (!separator) return [];
    const [question, ...answer] = line.split(separator);
    const q = question.trim();
    const a = answer.join(separator).trim();
    return q && a ? [{ question: q, answer: a }] : [];
  });
  return parsed.length ? parsed : undefined;
}

/** Convert persisted intake-shaped records to the framework-independent generator input. */
export function voicePackageInput(client: PackageClient, agent: PackageAgent, steps: PackageStep[]): VoicePackageInput {
  const byNumber = new Map(steps.map((step) => [step.step_number, step.data]));
  const s1 = byNumber.get(1) ?? {};
  const s2 = byNumber.get(2) ?? {};
  const s3 = byNumber.get(3) ?? {};
  const s4 = byNumber.get(4) ?? {};
  const s5 = byNumber.get(5) ?? {};
  const s6 = byNumber.get(6) ?? {};
  const transferTargets = Array.isArray(s3.transfer_targets)
    ? s3.transfer_targets.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const target = item as Record<string, unknown>;
        const targetNumber = string(target.number);
        return targetNumber ? [{ name: string(target.name), number: targetNumber, availability: string(target.availability) ?? string(target.hours) }] : [];
      })
    : undefined;
  const neverDo = [
    bool(s3.never_quote) ? "Quote a price" : undefined,
    bool(s3.never_arrival_promise) ? "Promise a specific arrival date or time" : undefined,
    bool(s3.never_legal_insurance) ? "Answer warranty, legal, or insurance-coverage questions" : undefined,
    bool(s3.never_competitors) ? "Discuss competitors" : undefined,
    ...(list(s3.never_do_other) ?? []),
  ].filter((item): item is string => Boolean(item));
  const credentials = [
    string(s4.licence) ? `Licence: ${string(s4.licence)}` : undefined,
    string(s4.insurance) ? `Insurance: ${string(s4.insurance)}` : undefined,
    string(s4.wcb) ? `WCB: ${string(s4.wcb)}` : undefined,
    string(s4.warranty) ? `Warranty: ${string(s4.warranty)}` : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    businessName: string(client.business_name) ?? "",
    agentName: string(s6.agent_name),
    voiceId: VOICES[string(s6.voice_id) ?? ""] ?? string(s6.voice_id),
    provisionedNumber: string(agent.provisioned_number),
    routingMode: string(s1.routing_mode) as RoutingMode | undefined,
    existingNumber: string(s1.existing_number),
    carrier: string(s1.carrier) as Carrier | undefined,
    ringsBeforeForward: numeric(s1.rings_before_forward),
    coverage: string(s2.coverage) as VoicePackageInput["coverage"],
    hours: DAYS.map((day) => ({ day, open: string(s2[`${day}_open`]), close: string(s2[`${day}_close`]), closed: bool(s2[`${day}_closed`]) })).filter((hour) => hour.closed || hour.open || hour.close),
    holidayCoverage: bool(s2.holidays),
    seasonalNote: string(s2.seasonal_note),
    hasEmergencies: bool(s2.has_emergencies),
    emergencyDefinition: string(s2.emergency_definition),
    primaryJob: string(s3.primary_job) as VoicePackageInput["primaryJob"],
    calendarType: string(s3.calendar_type),
    appointmentLength: string(s3.appointment_length),
    bookingBuffer: string(s3.buffer),
    bookOutDays: numeric(s3.book_out_days),
    bookableServices: list(s3.bookable_services),
    assignTo: string(s3.assign_to),
    qualifyingQuestions: list(s3.qualifying_questions),
    transferRule: string(s3.transfer_rules) as VoicePackageInput["transferRule"],
    transferTargets,
    neverDo: neverDo.length ? neverDo : undefined,
    businessOverview: string(s4.business_overview),
    services: list(s4.services),
    servicesNotOffered: list(s4.services_not_offered),
    serviceAreas: list(s4.service_area),
    travelLimit: string(s4.travel_limit),
    pricingPolicy: string(s4.pricing_policy) as VoicePackageInput["pricingPolicy"],
    pricingWording: string(s4.pricing_wording),
    paymentMethods: list(s4.payment_methods),
    financingOffered: bool(s4.financing_offered) ? "Offered" : undefined,
    credentials: credentials.length ? credentials : undefined,
    faqs: faqs(s4.faqs),
    smsTo: list(s5.sms_to),
    emailTo: list(s5.email_to),
    delivery: string(s5.delivery) as VoicePackageInput["delivery"],
    crmWebhook: string(s5.crm_webhook),
    fallbackNumber: string(s5.fallback_number),
    accountOwner: string(s5.account_owner),
    greeting: string(s6.greeting),
    namePronunciation: string(s6.name_pronunciation),
    tone: numeric(s6.tone),
    recordingNotice: bool(s6.recording_notice),
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function bytes(value: string | Buffer): Buffer {
  return typeof value === "string" ? Buffer.from(value, "utf8") : value;
}

async function reusableManifest(agentId: string, packageSha256: string): Promise<StoredManifest | null> {
  try {
    const manifest = JSON.parse(Buffer.from(await getVoiceMedia(manifestStorageKey(agentId))).toString("utf8")) as StoredManifest;
    if (manifest.version !== 1 || manifest.agentId !== agentId || manifest.packageSha256 !== packageSha256) return null;
    if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== Object.keys(VOICE_PACKAGE_ARTIFACTS).length) return null;
    await Promise.all(manifest.artifacts.map(async (artifact) => {
      if (!isVoicePackageArtifactKey(artifact.key) || artifact.storageKey !== voicePackageStorageKey(agentId, artifact.key)) throw new Error("Invalid package manifest");
      const stored = await getVoiceMedia(artifact.storageKey);
      if (stored.byteLength !== artifact.bytes || sha256(stored) !== artifact.sha256) throw new Error("Package artifact does not match manifest");
    }));
    return manifest;
  } catch {
    return null;
  }
}

/** Generate all six deliverables after intake completion and persist them via the voice-media storage seam. */
export async function generateAndStoreVoicePackage(input: {
  client: PackageClient;
  agent: PackageAgent;
  steps: PackageStep[];
}): Promise<GeneratedVoicePackage> {
  const agentId = safeAgentId(input.agent.id);
  if (input.client.id && input.agent.client_id && input.client.id !== input.agent.client_id) throw new Error("Voice agent does not belong to this client.");
  const ownedSteps = input.steps.filter((step) => !step.voice_agent_id || step.voice_agent_id === agentId);
  const completed = new Set(ownedSteps.filter((step) => step.state === "complete").map((step) => step.step_number));
  if ([1, 2, 3, 4, 5, 6].some((step) => !completed.has(step))) throw new Error("All six voice intake steps must be complete before package generation.");

  const generated = await generateVoiceAgentPackage(voicePackageInput(input.client, input.agent, ownedSteps));
  const payloads: Record<VoicePackageArtifactKey, Buffer> = {
    assistant: bytes(generated.assistantJson),
    knowledge: bytes(generated.knowledgeMarkdown),
    forwarding: bytes(generated.forwardingMarkdown),
    forwardingPdf: bytes(generated.forwardingPdf),
    brief: bytes(generated.briefMarkdown),
    briefPdf: bytes(generated.briefPdf),
  };
  const packageSha256 = createHash("sha256");
  for (const key of Object.keys(VOICE_PACKAGE_ARTIFACTS) as VoicePackageArtifactKey[]) {
    packageSha256.update(key).update("\0").update(payloads[key]).update("\0");
  }
  const digest = packageSha256.digest("hex");
  const existing = await reusableManifest(agentId, digest);
  if (existing) return { ...existing, reused: true };

  const artifacts = await Promise.all((Object.keys(VOICE_PACKAGE_ARTIFACTS) as VoicePackageArtifactKey[]).map(async (key) => {
    const definition = VOICE_PACKAGE_ARTIFACTS[key];
    const body = payloads[key];
    const storageKey = voicePackageStorageKey(agentId, key);
    await putVoiceMedia(storageKey, body, definition.contentType);
    return { key, filename: definition.filename, contentType: definition.contentType, storageKey, bytes: body.byteLength, sha256: sha256(body) };
  }));
  const manifest: StoredManifest = { version: 1, agentId, packageSha256: digest, generatedAt: new Date().toISOString(), artifacts };
  await putVoiceMedia(manifestStorageKey(agentId), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`), "application/json; charset=utf-8");
  return { ...manifest, reused: false };
}

export async function getVoicePackageArtifact(agentId: string, key: VoicePackageArtifactKey): Promise<Uint8Array> {
  return getVoiceMedia(voicePackageStorageKey(agentId, key));
}

type OwnershipDb = { voice_agents: Array<{ id: string; client_id: string }> };
type ArtifactLoader = (agentId: string, key: VoicePackageArtifactKey) => Promise<Uint8Array>;

/** Authorize and construct a protected download without trusting any path supplied by the caller. */
export async function packageDownloadResponse(
  clientId: string,
  agentId: string,
  key: string,
  db: OwnershipDb,
  load: ArtifactLoader = getVoicePackageArtifact,
): Promise<Response> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(agentId) || !isVoicePackageArtifactKey(key)) {
    return Response.json({ error: "Invalid package artifact" }, { status: 400 });
  }
  const ownsAgent = db.voice_agents.some((agent) => agent.id === agentId && agent.client_id === clientId);
  if (!ownsAgent) return Response.json({ error: "Package artifact not found" }, { status: 404 });

  try {
    const stored = await load(agentId, key);
    const artifact = VOICE_PACKAGE_ARTIFACTS[key];
    const body = stored.buffer.slice(stored.byteOffset, stored.byteOffset + stored.byteLength) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "Content-Type": artifact.contentType,
        "Content-Length": String(stored.byteLength),
        "Content-Disposition": `attachment; filename="${artifact.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Package artifact is unavailable" }, { status: 404 });
  }
}
