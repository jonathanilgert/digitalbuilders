import {
  assertProviderMutationsEnabled,
  mutationsEnabledFromEnv,
  ProviderHttpError,
  responseJson,
  safeProviderMessage,
  withProviderTimeout,
  type ProviderFetch,
} from "./common";

export type VapiAssistant = { id: string; name?: string; [key: string]: unknown };
export type VapiPhoneNumber = { id: string; number?: string; name?: string; assistantId?: string; [key: string]: unknown };
export type VapiAssistantInput = { name: string; [key: string]: unknown };
export type VapiTwilioImport = {
  name: string;
  number: string;
  assistantId?: string;
  twilioAccountSid: string;
  twilioAuthToken?: string;
  twilioApiKeySid?: string;
  twilioApiKeySecret?: string;
};

type VapiClientOptions = {
  privateKey: string;
  fetch?: ProviderFetch;
  mutationsEnabled?: boolean;
  baseUrl?: string;
  timeoutMs?: number;
};

export class VapiClient {
  private readonly fetcher: ProviderFetch;
  private readonly privateKey: string;
  private readonly mutationsEnabled: boolean;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: VapiClientOptions) {
    if (!options.privateKey) throw new Error("VAPI_PRIVATE_KEY is required.");
    this.privateKey = options.privateKey;
    this.fetcher = options.fetch ?? fetch;
    this.mutationsEnabled = options.mutationsEnabled ?? mutationsEnabledFromEnv();
    this.baseUrl = options.baseUrl ?? "https://api.vapi.ai";
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, withProviderTimeout({
      ...init,
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    }, this.timeoutMs));
    const body = await responseJson(response);
    if (!response.ok) throw new ProviderHttpError("Vapi", response.status, safeProviderMessage(body));
    return body;
  }

  async listAssistants(): Promise<VapiAssistant[]> {
    return collection(await this.request("/assistant")) as VapiAssistant[];
  }

  async getAssistant(id: string): Promise<VapiAssistant> {
    return await this.request(`/assistant/${encodeURIComponent(id)}`) as VapiAssistant;
  }

  async createAssistant(input: VapiAssistantInput, idempotencyKey?: string): Promise<VapiAssistant> {
    assertProviderMutationsEnabled(this.mutationsEnabled);
    return await this.request("/assistant", {
      method: "POST",
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      body: JSON.stringify(input),
    }) as VapiAssistant;
  }

  async updateAssistant(id: string, input: VapiAssistantInput): Promise<VapiAssistant> {
    assertProviderMutationsEnabled(this.mutationsEnabled);
    return await this.request(`/assistant/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }) as VapiAssistant;
  }

  async listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    return collection(await this.request("/phone-number")) as VapiPhoneNumber[];
  }

  async getPhoneNumber(id: string): Promise<VapiPhoneNumber> {
    return await this.request(`/phone-number/${encodeURIComponent(id)}`) as VapiPhoneNumber;
  }

  async importTwilioPhoneNumber(input: VapiTwilioImport, idempotencyKey?: string): Promise<VapiPhoneNumber> {
    assertProviderMutationsEnabled(this.mutationsEnabled);
    if (!input.twilioAccountSid) throw new Error("A Twilio account SID is required to import a phone number into Vapi.");
    if (!input.twilioAuthToken && !(input.twilioApiKeySid && input.twilioApiKeySecret)) {
      throw new Error("Twilio auth-token or API-key credentials are required to import a phone number into Vapi.");
    }
    const { twilioAuthToken, twilioApiKeySid, twilioApiKeySecret, ...details } = input;
    const credentials = twilioApiKeySid && twilioApiKeySecret
      ? { twilioApiKeySid, twilioApiKeySecret }
      : { twilioAuthToken };
    return await this.request("/phone-number", {
      method: "POST",
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      body: JSON.stringify({ provider: "twilio", ...details, ...credentials }),
    }) as VapiPhoneNumber;
  }

  async bindPhoneNumber(id: string, assistantId: string): Promise<VapiPhoneNumber> {
    assertProviderMutationsEnabled(this.mutationsEnabled);
    return await this.request(`/phone-number/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ assistantId }),
    }) as VapiPhoneNumber;
  }
}

function collection(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.results)) return record.results;
  }
  return [];
}

export function vapiPrivateKeyFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return env.VAPI_PRIVATE_KEY ?? "";
}