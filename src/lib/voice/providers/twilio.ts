import {
  assertProviderMutationsEnabled,
  mutationsEnabledFromEnv,
  ProviderHttpError,
  responseJson,
  safeProviderMessage,
  withProviderTimeout,
  type ProviderFetch,
} from "./common";

export type TwilioCredentials = {
  accountSid: string;
  authToken?: string;
  apiKeySid?: string;
  apiKeySecret?: string;
};

export type TwilioNumber = {
  sid: string;
  phoneNumber: string;
  friendlyName?: string;
  voiceUrl?: string;
  voiceFallbackUrl?: string;
  statusCallback?: string;
};

export type TwilioWebhookConfig = {
  voiceUrl?: string;
  voiceMethod?: "GET" | "POST";
  voiceFallbackUrl?: string;
  voiceFallbackMethod?: "GET" | "POST";
  statusCallback?: string;
  statusCallbackMethod?: "GET" | "POST";
};

type TwilioClientOptions = {
  credentials: TwilioCredentials;
  fetch?: ProviderFetch;
  mutationsEnabled?: boolean;
  baseUrl?: string;
  timeoutMs?: number;
};

function requiredCredentials(credentials: TwilioCredentials): { accountSid: string; username: string; password: string } {
  if (!credentials.accountSid) throw new Error("TWILIO_ACCOUNT_SID is required.");
  if (credentials.apiKeySid && credentials.apiKeySecret) {
    return { accountSid: credentials.accountSid, username: credentials.apiKeySid, password: credentials.apiKeySecret };
  }
  if (credentials.authToken) {
    return { accountSid: credentials.accountSid, username: credentials.accountSid, password: credentials.authToken };
  }
  throw new Error("Twilio requires an auth token or an API key SID and secret.");
}

function mapNumber(value: Record<string, unknown>): TwilioNumber {
  return {
    sid: String(value.sid ?? ""),
    phoneNumber: String(value.phone_number ?? ""),
    friendlyName: typeof value.friendly_name === "string" ? value.friendly_name : undefined,
    voiceUrl: typeof value.voice_url === "string" ? value.voice_url : undefined,
    voiceFallbackUrl: typeof value.voice_fallback_url === "string" ? value.voice_fallback_url : undefined,
    statusCallback: typeof value.status_callback === "string" ? value.status_callback : undefined,
  };
}

export class TwilioClient {
  private readonly fetcher: ProviderFetch;
  private readonly authorization: string;
  private readonly accountBaseUrl: string;
  private readonly mutationsEnabled: boolean;
  private readonly timeoutMs: number;

  constructor(options: TwilioClientOptions) {
    const credentials = requiredCredentials(options.credentials);
    this.fetcher = options.fetch ?? fetch;
    this.authorization = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`;
    this.accountBaseUrl = `${options.baseUrl ?? "https://api.twilio.com/2010-04-01"}/Accounts/${credentials.accountSid}`;
    this.mutationsEnabled = options.mutationsEnabled ?? mutationsEnabledFromEnv();
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async request(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
    const response = await this.fetcher(`${this.accountBaseUrl}${path}`, withProviderTimeout({
      ...init,
      headers: { Authorization: this.authorization, ...init?.headers },
    }, this.timeoutMs));
    const body = await responseJson(response);
    if (!response.ok) throw new ProviderHttpError("Twilio", response.status, safeProviderMessage(body));
    return (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  }

  async findIncomingNumberByFriendlyName(friendlyName: string): Promise<TwilioNumber | undefined> {
    const query = new URLSearchParams({ FriendlyName: friendlyName, PageSize: "20" });
    const body = await this.request(`/IncomingPhoneNumbers.json?${query}`);
    const numbers = Array.isArray(body.incoming_phone_numbers) ? body.incoming_phone_numbers : [];
    return numbers.map((item) => mapNumber(item as Record<string, unknown>)).find((item) => item.friendlyName === friendlyName);
  }

  async getIncomingNumber(sid: string): Promise<TwilioNumber> {
    return mapNumber(await this.request(`/IncomingPhoneNumbers/${encodeURIComponent(sid)}.json`));
  }

  async findAvailableCanadianLocalNumber(areaCodes: readonly string[]): Promise<string | undefined> {
    for (const areaCode of areaCodes) {
      const query = new URLSearchParams({ AreaCode: areaCode, VoiceEnabled: "true", SmsEnabled: "true", Limit: "1" });
      const body = await this.request(`/AvailablePhoneNumbers/CA/Local.json?${query}`);
      const numbers = Array.isArray(body.available_phone_numbers) ? body.available_phone_numbers : [];
      const number = (numbers[0] as Record<string, unknown> | undefined)?.phone_number;
      if (typeof number === "string" && number) return number;
    }
    return undefined;
  }

  async purchaseIncomingNumber(phoneNumber: string, friendlyName: string, webhooks: TwilioWebhookConfig = {}): Promise<TwilioNumber> {
    assertProviderMutationsEnabled(this.mutationsEnabled);
    const body = new URLSearchParams({ PhoneNumber: phoneNumber, FriendlyName: friendlyName });
    appendWebhooks(body, webhooks);
    return mapNumber(await this.request("/IncomingPhoneNumbers.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }));
  }

  async configureIncomingNumber(sid: string, webhooks: TwilioWebhookConfig): Promise<TwilioNumber> {
    assertProviderMutationsEnabled(this.mutationsEnabled);
    const body = new URLSearchParams();
    appendWebhooks(body, webhooks);
    return mapNumber(await this.request(`/IncomingPhoneNumbers/${encodeURIComponent(sid)}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }));
  }
}

function appendWebhooks(body: URLSearchParams, config: TwilioWebhookConfig): void {
  if (config.voiceUrl !== undefined) body.set("VoiceUrl", config.voiceUrl);
  if (config.voiceMethod !== undefined) body.set("VoiceMethod", config.voiceMethod);
  if (config.voiceFallbackUrl !== undefined) body.set("VoiceFallbackUrl", config.voiceFallbackUrl);
  if (config.voiceFallbackMethod !== undefined) body.set("VoiceFallbackMethod", config.voiceFallbackMethod);
  if (config.statusCallback !== undefined) body.set("StatusCallback", config.statusCallback);
  if (config.statusCallbackMethod !== undefined) body.set("StatusCallbackMethod", config.statusCallbackMethod);
}

export function twilioCredentialsFromEnv(env: NodeJS.ProcessEnv = process.env): TwilioCredentials {
  return {
    accountSid: env.TWILIO_ACCOUNT_SID ?? "",
    authToken: env.TWILIO_AUTH_TOKEN,
    apiKeySid: env.TWILIO_API_KEY_SID,
    apiKeySecret: env.TWILIO_API_KEY_SECRET,
  };
}