import { site } from "@/lib/content";
import { portalLink, sendMail } from "@/lib/portal/mail";
import { claimVoiceProvisioning, readDb, recordIdempotency, releaseIdempotency, setVoiceProvisioning, setVoiceStatus } from "@/lib/portal/store";
import { getVoiceMedia } from "@/lib/voice/media-storage";
import { voicePackageStorageKey } from "@/lib/voice/package-service";
import { provisionVoiceProviders } from "@/lib/voice/providers/provision";
import { TwilioClient, twilioCredentialsFromEnv } from "@/lib/voice/providers/twilio";
import { VapiClient, vapiPrivateKeyFromEnv } from "@/lib/voice/providers/vapi";

const PROVISIONING_LEASE_MS = 5 * 60_000;
const PROVIDER_TIMEOUT_MS = 20_000;

export async function runVoiceProvisioning(agentId?: string) {
  if (process.env.VOICE_PROVIDER_MUTATIONS_ENABLED !== "true") throw new Error("Provider mutations are disabled");
  const db = await readDb();
  const candidates = db.voice_agents.filter((item) => item.package_generated_at && ["ready_to_build", "building"].includes(item.status) && (!agentId || item.id === agentId));
  const results: Array<{ agent_id: string; status: string; error?: string }> = [];
  for (const candidate of candidates.slice(0, 5)) {
    const claim = await claimVoiceProvisioning(candidate.id, PROVISIONING_LEASE_MS);
    if (!claim.claimed || !claim.agent || !claim.leaseToken) { results.push({ agent_id: candidate.id, status: "busy-or-complete" }); continue; }
    try {
      await setVoiceStatus(candidate.id, "building");
      const renewed = await setVoiceProvisioning(candidate.id, { lease_token: claim.leaseToken, renew_lease_ms: PROVISIONING_LEASE_MS });
      if (!renewed) throw new Error("Provisioning lease was lost");
      const assistant = JSON.parse(Buffer.from(await getVoiceMedia(voicePackageStorageKey(candidate.id, "assistant"))).toString("utf8")) as { name: string; [key: string]: unknown };
      const serverCredentialId = process.env.VAPI_SERVER_CREDENTIAL_ID;
      if (!serverCredentialId) throw new Error("VAPI_SERVER_CREDENTIAL_ID is required for authenticated call webhooks");
      assistant.server = { url: `${site.url}/api/vapi/webhook`, credentialId: serverCredentialId };
      assistant.serverMessages = ["end-of-call-report", "status-update"];
      const credentials = twilioCredentialsFromEnv();
      await provisionVoiceProviders({
        checkpoint: async () => {
          const saved = await setVoiceProvisioning(candidate.id, { lease_token: claim.leaseToken!, renew_lease_ms: PROVISIONING_LEASE_MS });
          if (!saved) throw new Error("Provisioning lease was lost");
        },
        repository: {
          load: async () => {
            const current = (await readDb()).voice_agents.find((item) => item.id === candidate.id);
            if (!current) throw new Error("Voice agent disappeared during provisioning");
            return current;
          },
          persist: async (patch) => {
            const saved = await setVoiceProvisioning(candidate.id, { ...patch, lease_token: claim.leaseToken!, renew_lease_ms: PROVISIONING_LEASE_MS });
            if (!saved) throw new Error("Provisioning lease was lost");
          },
        },
        twilio: new TwilioClient({ credentials, timeoutMs: PROVIDER_TIMEOUT_MS }), vapi: new VapiClient({ privateKey: vapiPrivateKeyFromEnv(), timeoutMs: PROVIDER_TIMEOUT_MS }), twilioCredentials: credentials, assistant,
        resourceName: `Digital Builders ${candidate.id}`, bindPhoneOnProvision: false,
      });
      await setVoiceStatus(candidate.id, "test_call");
      const owner = db.clients.find((item) => item.id === candidate.client_id);
      const notice = await recordIdempotency("voice-test-ready-notice", candidate.id, candidate.id);
      if (owner && notice.created) {
        try { await sendMail(owner.email, "Your voice-agent test is ready", `Hi ${owner.contact_name || "there"},\n\nYour test agent is ready. Open your portal to place a test call, review the result, request changes, or approve go-live.\n\n${portalLink(owner)}\n\nDigital Builders`); }
        catch (error) { await releaseIdempotency("voice-test-ready-notice", candidate.id); console.error("Voice test-ready notification failed", error); }
      }
      results.push({ agent_id: candidate.id, status: "provisioned" });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Provisioning failed";
      await setVoiceProvisioning(candidate.id, { provisioning_state: "failed", provisioning_error: message, lease_token: claim.leaseToken });
      await sendMail(process.env.PORTAL_NOTIFY_EMAIL || site.inquiriesEmail, `Voice provisioning needs attention: ${candidate.id}`, `Provisioning stopped safely and can be retried.\n\n${message}`).catch(() => undefined);
      results.push({ agent_id: candidate.id, status: "failed", error: message });
    }
  }
  return results;
}
