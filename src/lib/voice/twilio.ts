import type { VoiceAgent } from "@/lib/portal/types";
import { claimVoiceProvisioning, setVoiceProvisioning } from "@/lib/portal/store";

function credentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error("Twilio number provisioning is not configured.");
  return { accountSid, authToken, authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}` };
}

async function twilioRequest(path: string, init?: RequestInit) {
  const { accountSid, authorization } = credentials();
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}`, { ...init, headers: { Authorization: authorization, ...(init?.headers || {}) } });
  const json = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof json.message === "string" ? json.message : `Twilio request failed (${response.status})`);
  return json;
}

export async function provisionCanadianLocalNumber(agent: VoiceAgent) {
  if (agent.provisioned_number && agent.twilio_number_sid) return agent;
  const claim = await claimVoiceProvisioning(agent.id);
  if (!claim.claimed) return claim.agent;
  const areaCodes = (process.env.TWILIO_LOCAL_AREA_CODES || "403,587,825").split(",").map((code) => code.trim()).filter(Boolean);
  try {
    const friendlyName = `Digital Builders ${agent.id}`;
    const prior = await twilioRequest(`/IncomingPhoneNumbers.json?FriendlyName=${encodeURIComponent(friendlyName)}&PageSize=1`);
    const existing = (prior.incoming_phone_numbers as Array<{ phone_number?: string; sid?: string }> | undefined)?.[0];
    if (existing?.phone_number && existing.sid) return await setVoiceProvisioning(agent.id, { provisioned_number: existing.phone_number, twilio_number_sid: existing.sid, provisioning_state: "provisioned", provisioning_error: undefined });
    let phoneNumber = "";
    for (const areaCode of areaCodes) {
      const result = await twilioRequest(`/AvailablePhoneNumbers/CA/Local.json?AreaCode=${encodeURIComponent(areaCode)}&VoiceEnabled=true&SmsEnabled=true&Limit=1`);
      const available = result.available_phone_numbers as Array<{ phone_number?: string }> | undefined;
      phoneNumber = available?.[0]?.phone_number || "";
      if (phoneNumber) break;
    }
    if (!phoneNumber) throw new Error("No local Alberta number is currently available.");
    const purchased = await twilioRequest(`/IncomingPhoneNumbers.json`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ PhoneNumber: phoneNumber, FriendlyName: friendlyName }) });
    return await setVoiceProvisioning(agent.id, { provisioned_number: String(purchased.phone_number || phoneNumber), twilio_number_sid: String(purchased.sid || ""), provisioning_state: "provisioned", provisioning_error: undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown number-provisioning error";
    await setVoiceProvisioning(agent.id, { provisioning_state: "failed", provisioning_error: message });
    throw error;
  }
}
