import { describe, expect, it, vi } from "vitest";
import {
  TwilioClient,
  VapiClient,
  provisionVoiceProviders,
  type TwilioNumber,
  type TwilioProvisioningClient,
  type VapiAssistant,
  type VapiAssistantInput,
  type VapiPhoneNumber,
  type VapiProvisioningClient,
  type VapiTwilioImport,
  type VoiceProviderPatch,
  type VoiceProviderState,
} from "../src/lib/voice/providers";

const NUMBER = "+14035550199";
const NAME = "Digital Builders agent-1";
const ASSISTANT_INPUT = { name: "replaced-by-stable-name", model: { provider: "openai", model: "gpt-4.1-mini" } };

class FakeTwilio implements TwilioProvisioningClient {
  numbers: TwilioNumber[] = [];
  purchases = 0;
  configurations = 0;

  async findIncomingNumberByFriendlyName(name: string) { return this.numbers.find((item) => item.friendlyName === name); }
  async getIncomingNumber(sid: string) {
    const result = this.numbers.find((item) => item.sid === sid);
    if (!result) throw new Error("not found");
    return result;
  }
  async findAvailableCanadianLocalNumber() { return NUMBER; }
  async purchaseIncomingNumber(number: string, name: string) {
    this.purchases += 1;
    const result = { sid: "PN1", phoneNumber: number, friendlyName: name };
    this.numbers.push(result);
    return result;
  }
  async configureIncomingNumber(sid: string) {
    this.configurations += 1;
    return this.getIncomingNumber(sid);
  }
}

class FakeVapi implements VapiProvisioningClient {
  assistants: VapiAssistant[] = [];
  phones: VapiPhoneNumber[] = [];
  assistantCreates = 0;
  assistantUpdates = 0;
  phoneCreates = 0;
  binds = 0;

  async listAssistants() { return this.assistants; }
  async getAssistant(id: string) {
    const result = this.assistants.find((item) => item.id === id);
    if (!result) throw new Error("not found");
    return result;
  }
  async createAssistant(input: VapiAssistantInput) {
    this.assistantCreates += 1;
    const result = { id: "AS1", ...input };
    this.assistants.push(result);
    return result;
  }
  async updateAssistant(id: string, input: VapiAssistantInput) {
    this.assistantUpdates += 1;
    const result = { id, ...input };
    this.assistants = this.assistants.map((item) => item.id === id ? result : item);
    return result;
  }
  async listPhoneNumbers() { return this.phones; }
  async getPhoneNumber(id: string) {
    const result = this.phones.find((item) => item.id === id);
    if (!result) throw new Error("not found");
    return result;
  }
  async importTwilioPhoneNumber(input: VapiTwilioImport) {
    this.phoneCreates += 1;
    const result = { id: "PH1", name: input.name, number: input.number, assistantId: input.assistantId };
    this.phones.push(result);
    return result;
  }
  async bindPhoneNumber(id: string, assistantId: string) {
    this.binds += 1;
    const phone = await this.getPhoneNumber(id);
    phone.assistantId = assistantId;
    return phone;
  }
}

function harness(initial: VoiceProviderState = { id: "agent-1" }) {
  let state = { ...initial };
  const twilio = new FakeTwilio();
  const vapi = new FakeVapi();
  let persistCall = 0;
  let failOnPersist: number | undefined;
  const repository = {
    async load() { return { ...state }; },
    async persist(patch: VoiceProviderPatch) {
      persistCall += 1;
      if (persistCall === failOnPersist) throw new Error("simulated persistence crash");
      state = { ...state, ...patch };
    },
  };
  const run = () => provisionVoiceProviders({
    repository,
    twilio,
    vapi,
    assistant: ASSISTANT_INPUT,
    twilioCredentials: { accountSid: "AC1", authToken: "token" },
    mutationsEnabled: true,
  });
  return {
    twilio, vapi, repository, run,
    state: () => state,
    failNextAt(call: number) { persistCall = 0; failOnPersist = call; },
    clearFailure() { persistCall = 0; failOnPersist = undefined; },
  };
}

function seedDid(h: ReturnType<typeof harness>) {
  h.twilio.numbers.push({ sid: "PN1", phoneNumber: NUMBER, friendlyName: NAME });
}
function seedAssistant(h: ReturnType<typeof harness>) {
  h.vapi.assistants.push({ id: "AS1", name: NAME, model: ASSISTANT_INPUT.model });
}
function seedPhone(h: ReturnType<typeof harness>, assistantId = "AS1") {
  h.vapi.phones.push({ id: "PH1", name: NAME, number: NUMBER, assistantId });
}

describe("resumable provider orchestration", () => {
  it("reconciles an existing DID instead of purchasing another", async () => {
    const h = harness();
    seedDid(h);
    await h.run();
    expect(h.twilio.purchases).toBe(0);
    expect(h.state()).toMatchObject({ twilio_number_sid: "PN1", provisioning_state: "provisioned" });
  });

  it("reconciles an existing assistant instead of creating another", async () => {
    const h = harness({ id: "agent-1", twilio_number_sid: "PN1", provisioned_number: NUMBER });
    seedDid(h);
    seedAssistant(h);
    await h.run();
    expect(h.vapi.assistantCreates).toBe(0);
    expect(h.state().vapi_assistant_id).toBe("AS1");
  });

  it("reconciles an existing Vapi phone and only fixes its binding", async () => {
    const h = harness({ id: "agent-1", twilio_number_sid: "PN1", provisioned_number: NUMBER, vapi_assistant_id: "AS1" });
    seedDid(h);
    seedAssistant(h);
    seedPhone(h, "old-assistant");
    await h.run();
    expect(h.vapi.phoneCreates).toBe(0);
    expect(h.vapi.binds).toBe(1);
    expect(h.state().vapi_phone_number_id).toBe("PH1");
  });

  it("does no provider mutations when all resources are already bound and current", async () => {
    const h = harness({
      id: "agent-1", twilio_number_sid: "PN1", provisioned_number: NUMBER,
      vapi_assistant_id: "AS1", vapi_phone_number_id: "PH1", provisioning_state: "provisioned",
    });
    seedDid(h); seedAssistant(h); seedPhone(h);
    await h.run();
    expect({
      purchases: h.twilio.purchases, configurations: h.twilio.configurations,
      assistantCreates: h.vapi.assistantCreates, assistantUpdates: h.vapi.assistantUpdates,
      phoneCreates: h.vapi.phoneCreates, binds: h.vapi.binds,
    }).toEqual({ purchases: 0, configurations: 0, assistantCreates: 0, assistantUpdates: 0, phoneCreates: 0, binds: 0 });
  });

  it.each([
    ["DID", 2],
    ["assistant", 3],
    ["Vapi phone", 4],
    ["final bound checkpoint", 5],
  ])("resumes after a crash at the %s boundary without duplicate resources", async (_label, persistBoundary) => {
    const h = harness();
    h.failNextAt(persistBoundary);
    await expect(h.run()).rejects.toThrow("simulated persistence crash");
    h.clearFailure();
    const result = await h.run();
    expect(result).toMatchObject({
      twilio_number_sid: "PN1", vapi_assistant_id: "AS1", vapi_phone_number_id: "PH1", provisioning_state: "provisioned",
    });
    expect(h.twilio.purchases).toBe(1);
    expect(h.vapi.assistantCreates).toBe(1);
    expect(h.vapi.phoneCreates).toBe(1);
    expect(h.twilio.numbers).toHaveLength(1);
    expect(h.vapi.assistants).toHaveLength(1);
    expect(h.vapi.phones).toHaveLength(1);
  });

  it("blocks orchestration before repository or provider access when the mutation gate is off", async () => {
    const h = harness();
    const load = vi.spyOn(h.repository, "load");
    await expect(provisionVoiceProviders({
      repository: h.repository, twilio: h.twilio, vapi: h.vapi,
      assistant: ASSISTANT_INPUT, twilioCredentials: { accountSid: "AC1", authToken: "secret" }, mutationsEnabled: false,
    })).rejects.toThrow(/mutations are disabled/i);
    expect(load).not.toHaveBeenCalled();
    expect(h.twilio.purchases).toBe(0);
  });
});

describe("HTTP provider clients", () => {
  it("searches Canadian area codes and purchases with API-key auth and fallback webhook config", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.includes("AvailablePhoneNumbers")) return Response.json({ available_phone_numbers: [{ phone_number: NUMBER }] });
      return Response.json({ sid: "PN1", phone_number: NUMBER, friendly_name: NAME, voice_fallback_url: "https://fallback.test/voice" });
    });
    const client = new TwilioClient({
      credentials: { accountSid: "AC1", apiKeySid: "SK1", apiKeySecret: "api-secret" },
      fetch: fetcher, mutationsEnabled: true,
    });
    expect(await client.findAvailableCanadianLocalNumber(["403"])).toBe(NUMBER);
    await client.purchaseIncomingNumber(NUMBER, NAME, { voiceFallbackUrl: "https://fallback.test/voice", voiceFallbackMethod: "POST" });
    expect(requests[0].url).toContain("AvailablePhoneNumbers/CA/Local.json");
    expect(new Headers(requests[0].init?.headers).get("Authorization")).toBe(`Basic ${Buffer.from("SK1:api-secret").toString("base64")}`);
    expect(String(requests[1].init?.body)).toContain("VoiceFallbackUrl=https%3A%2F%2Ffallback.test%2Fvoice");
  });

  it("aborts Twilio and Vapi requests at their configured deadline", async () => {
    const neverRespond = vi.fn((_input: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return reject(new Error("missing AbortSignal"));
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));
    const twilio = new TwilioClient({ credentials: { accountSid: "AC1", authToken: "secret" }, fetch: neverRespond, timeoutMs: 5 });
    const vapi = new VapiClient({ privateKey: "secret", fetch: neverRespond, timeoutMs: 5 });

    await expect(twilio.getIncomingNumber("PN1")).rejects.toThrow(/timeout|aborted/i);
    await expect(vapi.getAssistant("AS1")).rejects.toThrow(/timeout|aborted/i);
    expect(neverRespond).toHaveBeenCalledTimes(2);
  });

  it("creates/updates Vapi resources and blocks each client mutation when gated", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      if (path === "/assistant") return Response.json({ id: "AS1", ...JSON.parse(String(init?.body)) });
      if (path === "/phone-number") return Response.json({ id: "PH1", ...JSON.parse(String(init?.body)) });
      return Response.json({ id: path.split("/").pop(), ...JSON.parse(String(init?.body)) });
    });
    const enabled = new VapiClient({ privateKey: "vapi-secret", fetch: fetcher, mutationsEnabled: true });
    await enabled.createAssistant({ name: NAME }, "agent-1:assistant");
    await enabled.updateAssistant("AS1", { name: NAME });
    await enabled.importTwilioPhoneNumber({ name: NAME, number: NUMBER, assistantId: "AS1", twilioAccountSid: "AC1", twilioAuthToken: "twilio-secret" }, "agent-1:phone");
    await enabled.bindPhoneNumber("PH1", "AS1");
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Idempotency-Key")).toBe("agent-1:assistant");
    expect(JSON.parse(String(fetcher.mock.calls[2][1]?.body))).toMatchObject({ provider: "twilio", twilioAuthToken: "twilio-secret" });

    const blockedFetch = vi.fn<typeof fetch>();
    const blockedTwilio = new TwilioClient({ credentials: { accountSid: "AC1", authToken: "secret" }, fetch: blockedFetch, mutationsEnabled: false });
    const blockedVapi = new VapiClient({ privateKey: "secret", fetch: blockedFetch, mutationsEnabled: false });
    await expect(blockedTwilio.purchaseIncomingNumber(NUMBER, NAME)).rejects.toThrow(/disabled/i);
    await expect(blockedTwilio.configureIncomingNumber("PN1", {})).rejects.toThrow(/disabled/i);
    await expect(blockedVapi.createAssistant({ name: NAME })).rejects.toThrow(/disabled/i);
    await expect(blockedVapi.updateAssistant("AS1", { name: NAME })).rejects.toThrow(/disabled/i);
    await expect(blockedVapi.importTwilioPhoneNumber({ name: NAME, number: NUMBER, assistantId: "AS1", twilioAccountSid: "AC1", twilioAuthToken: "secret" })).rejects.toThrow(/disabled/i);
    await expect(blockedVapi.bindPhoneNumber("PH1", "AS1")).rejects.toThrow(/disabled/i);
    expect(blockedFetch).not.toHaveBeenCalled();
  });
});
