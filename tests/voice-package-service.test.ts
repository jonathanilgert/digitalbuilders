import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  generateAndStoreVoicePackage,
  voicePackageInput,
  voicePackageStorageKey,
  type PackageStep,
} from "../src/lib/voice/package-service";

let temporaryRoot: string | undefined;
afterEach(async () => {
  delete process.env.PORTAL_DATA_DIR;
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
  temporaryRoot = undefined;
});

function completeSteps(): PackageStep[] {
  const data: Record<number, Record<string, unknown>> = {
    1: { routing_mode: "forward_no_answer", carrier: "Telus", rings_before_forward: 4 },
    2: { coverage: "overflow_and_after_hours", Monday_open: "08:00", Monday_close: "17:00", holidays: true, has_emergencies: true, emergency_definition: "Active flooding" },
    3: { primary_job: "faq_book", calendar_type: "Google", qualifying_questions: "What is your address?\nWhat happened?", transfer_rules: "emergencies_only", transfer_targets: [{ number: "403-555-0100", hours: "business hours" }], never_quote: true },
    4: { business_overview: "A local plumbing company.", services: "Repairs, Drain cleaning", services_not_offered: "Septic work", service_area: "Calgary, Airdrie", pricing_policy: "free_estimate", payment_methods: "Visa, cash", financing_offered: true, licence: "AB-123", faqs: "Do you offer estimates? | Yes, estimates are free." },
    5: { sms_to: "403-555-0101", email_to: "dispatch@example.com", delivery: "immediate" },
    6: { agent_name: "Maya", voice_id: "warm_clear", greeting: "Thanks for calling Prairie Plumbing, this is Maya — how can I help?", tone: 55, recording_notice: true },
  };
  return [1, 2, 3, 4, 5, 6].map((step_number) => ({ voice_agent_id: "voice_123", step_number, data: data[step_number], state: "complete" }));
}

describe("voice package integration service", () => {
  it("maps plain intake records, persists all six artifacts, and reuses identical output", async () => {
    temporaryRoot = await mkdtemp(path.join(tmpdir(), "voice-package-"));
    process.env.PORTAL_DATA_DIR = temporaryRoot;
    const request = {
      client: { id: "client_1", business_name: "Prairie Plumbing" },
      agent: { id: "voice_123", client_id: "client_1", provisioned_number: "+1 587 555 0199" },
      steps: completeSteps(),
    };

    const mapped = voicePackageInput(request.client, request.agent, request.steps);
    expect(mapped.voiceId).toBe("Savannah");
    expect(mapped.services).toEqual(["Repairs", "Drain cleaning"]);
    expect(mapped.faqs).toEqual([{ question: "Do you offer estimates?", answer: "Yes, estimates are free." }]);
    expect(mapped.transferTargets?.[0].availability).toBe("business hours");

    const first = await generateAndStoreVoicePackage(request);
    expect(first.reused).toBe(false);
    expect(first.artifacts).toHaveLength(6);
    expect(new Set(first.artifacts.map((artifact) => artifact.key))).toEqual(new Set(["assistant", "knowledge", "forwarding", "forwardingPdf", "brief", "briefPdf"]));
    for (const artifact of first.artifacts) {
      const stored = await readFile(path.join(temporaryRoot, "voice-media", artifact.storageKey));
      expect(stored.byteLength).toBe(artifact.bytes);
      expect(stored.toString()).not.toMatch(/{{[^{}]*}}/);
    }
    const assistant = JSON.parse(await readFile(path.join(temporaryRoot, "voice-media", voicePackageStorageKey("voice_123", "assistant")), "utf8"));
    expect(assistant.model.messages[0].content).toContain('[SPOKEN] "');
    expect(assistant.model.messages[0].content).toContain("[INSTRUCTION] ");
    expect(assistant.model.messages[0].content).not.toMatch(/\[INSTRUCTION\] "/);

    const assistantPath = path.join(temporaryRoot, "voice-media", voicePackageStorageKey("voice_123", "assistant"));
    const before = (await stat(assistantPath)).mtimeMs;
    const second = await generateAndStoreVoicePackage(request);
    expect(second.reused).toBe(true);
    expect(second.generatedAt).toBe(first.generatedAt);
    expect(second.packageSha256).toBe(first.packageSha256);
    expect((await stat(assistantPath)).mtimeMs).toBe(before);
  });

  it("requires six completed owned steps and rejects unsafe identifiers/placeholders", async () => {
    temporaryRoot = await mkdtemp(path.join(tmpdir(), "voice-package-"));
    process.env.PORTAL_DATA_DIR = temporaryRoot;
    const base = { client: { id: "client_1", business_name: "Business" }, agent: { id: "voice_123", client_id: "client_1" }, steps: completeSteps() };
    await expect(generateAndStoreVoicePackage({ ...base, steps: base.steps.slice(0, 5) })).rejects.toThrow(/six voice intake steps/);
    await expect(generateAndStoreVoicePackage({ ...base, agent: { ...base.agent, id: "../other" } })).rejects.toThrow(/Invalid voice agent id/);
    await expect(generateAndStoreVoicePackage({ ...base, client: { ...base.client, business_name: "{{business}}" } })).rejects.toThrow(/Unresolved template placeholder/);
    expect(() => voicePackageStorageKey("voice_123", "assistant")).not.toThrow();
  });
});
