import { assertProviderMutationsEnabled } from "./common";
import type { TwilioCredentials, TwilioNumber, TwilioWebhookConfig } from "./twilio";
import type { VapiAssistant, VapiAssistantInput, VapiPhoneNumber, VapiTwilioImport } from "./vapi";

export type VoiceProviderState = {
  id: string;
  provisioned_number?: string;
  twilio_number_sid?: string;
  vapi_assistant_id?: string;
  vapi_phone_number_id?: string;
  provisioning_state?: "pending" | "provisioning" | "provisioned" | "failed";
  provisioning_error?: string;
};

export type VoiceProviderPatch = Partial<Omit<VoiceProviderState, "id">>;

export type VoiceProviderRepository = {
  load(): Promise<VoiceProviderState>;
  /** Must durably store this patch before resolving. */
  persist(patch: VoiceProviderPatch): Promise<void>;
};

export type TwilioProvisioningClient = {
  findIncomingNumberByFriendlyName(name: string): Promise<TwilioNumber | undefined>;
  getIncomingNumber(sid: string): Promise<TwilioNumber>;
  findAvailableCanadianLocalNumber(areaCodes: readonly string[]): Promise<string | undefined>;
  purchaseIncomingNumber(number: string, name: string, webhooks?: TwilioWebhookConfig): Promise<TwilioNumber>;
  configureIncomingNumber(sid: string, webhooks: TwilioWebhookConfig): Promise<TwilioNumber>;
};

export type VapiProvisioningClient = {
  listAssistants(): Promise<VapiAssistant[]>;
  getAssistant(id: string): Promise<VapiAssistant>;
  createAssistant(input: VapiAssistantInput, idempotencyKey?: string): Promise<VapiAssistant>;
  updateAssistant(id: string, input: VapiAssistantInput): Promise<VapiAssistant>;
  listPhoneNumbers(): Promise<VapiPhoneNumber[]>;
  getPhoneNumber(id: string): Promise<VapiPhoneNumber>;
  importTwilioPhoneNumber(input: VapiTwilioImport, idempotencyKey?: string): Promise<VapiPhoneNumber>;
  bindPhoneNumber(id: string, assistantId: string): Promise<VapiPhoneNumber>;
};

export type ProvisionVoiceProvidersOptions = {
  repository: VoiceProviderRepository;
  twilio: TwilioProvisioningClient;
  vapi: VapiProvisioningClient;
  twilioCredentials: TwilioCredentials;
  assistant: VapiAssistantInput;
  areaCodes?: readonly string[];
  twilioWebhooks?: TwilioWebhookConfig;
  resourceName?: string;
  mutationsEnabled?: boolean;
  /** Renew/check the caller's durable lease immediately before provider mutations. */
  checkpoint?: () => Promise<void>;
  /** Keep false for sandbox provisioning; bind only after explicit client approval. Defaults true for backwards compatibility. */
  bindPhoneOnProvision?: boolean;
};

/**
 * Reconciliation loop with a durable checkpoint after every externally created
 * resource. If persistence fails after a provider accepted a mutation, the next
 * run discovers the resource by its stable name/number instead of creating it
 * again. Repository locking/leases remain the caller's responsibility.
 */
export async function provisionVoiceProviders(options: ProvisionVoiceProvidersOptions): Promise<VoiceProviderState> {
  assertProviderMutationsEnabled(options.mutationsEnabled ?? process.env.VOICE_PROVIDER_MUTATIONS_ENABLED === "true");
  let state = await options.repository.load();
  const name = options.resourceName ?? `Digital Builders ${state.id}`;
  const persist = async (patch: VoiceProviderPatch) => {
    await options.repository.persist(patch);
    state = { ...state, ...patch };
  };

  await persist({ provisioning_state: "provisioning", provisioning_error: undefined });

  let twilioNumber: TwilioNumber;
  if (state.twilio_number_sid) {
    twilioNumber = await options.twilio.getIncomingNumber(state.twilio_number_sid);
    requireResource(twilioNumber.sid, "Twilio number SID");
    requireResource(twilioNumber.phoneNumber, "Twilio phone number");
    if (state.provisioned_number !== twilioNumber.phoneNumber) {
      await persist({ provisioned_number: twilioNumber.phoneNumber });
    }
  } else {
    const existing = await options.twilio.findIncomingNumberByFriendlyName(name);
    if (existing) {
      twilioNumber = existing;
    } else {
      const available = await options.twilio.findAvailableCanadianLocalNumber(options.areaCodes ?? ["403", "587", "780", "825"]);
      if (!available) throw new Error("No Canadian local Twilio number is currently available.");
      await options.checkpoint?.();
      twilioNumber = await options.twilio.purchaseIncomingNumber(available, name, options.twilioWebhooks);
    }
    requireResource(twilioNumber.sid, "Twilio number SID");
    requireResource(twilioNumber.phoneNumber, "Twilio phone number");
    await persist({ twilio_number_sid: twilioNumber.sid, provisioned_number: twilioNumber.phoneNumber });
  }

  if (options.twilioWebhooks && !webhooksMatch(twilioNumber, options.twilioWebhooks)) {
    await options.checkpoint?.();
    twilioNumber = await options.twilio.configureIncomingNumber(twilioNumber.sid, options.twilioWebhooks);
  }

  let assistant: VapiAssistant;
  if (state.vapi_assistant_id) {
    assistant = await options.vapi.getAssistant(state.vapi_assistant_id);
  } else {
    assistant = (await options.vapi.listAssistants()).find((item) => item.name === name)!;
    if (!assistant) {
      await options.checkpoint?.();
      assistant = await options.vapi.createAssistant({ ...options.assistant, name }, `${state.id}:assistant`);
    }
    requireResource(assistant.id, "Vapi assistant ID");
    await persist({ vapi_assistant_id: assistant.id });
  }
  if (!containsDesired(assistant, { ...options.assistant, name })) {
    await options.checkpoint?.();
    assistant = await options.vapi.updateAssistant(assistant.id, { ...options.assistant, name });
  }

  let phone: VapiPhoneNumber;
  if (state.vapi_phone_number_id) {
    phone = await options.vapi.getPhoneNumber(state.vapi_phone_number_id);
  } else {
    phone = (await options.vapi.listPhoneNumbers()).find((item) => item.number === twilioNumber.phoneNumber || item.name === name)!;
    if (!phone) {
      await options.checkpoint?.();
      phone = await options.vapi.importTwilioPhoneNumber({
        name,
        number: twilioNumber.phoneNumber,
        assistantId: options.bindPhoneOnProvision === false ? undefined : assistant.id,
        twilioAccountSid: options.twilioCredentials.accountSid,
        twilioAuthToken: options.twilioCredentials.authToken,
        twilioApiKeySid: options.twilioCredentials.apiKeySid,
        twilioApiKeySecret: options.twilioCredentials.apiKeySecret,
      }, `${state.id}:phone-number`);
    }
    requireResource(phone.id, "Vapi phone-number ID");
    await persist({ vapi_phone_number_id: phone.id });
  }
  if (options.bindPhoneOnProvision !== false && phone.assistantId !== assistant.id) {
    await options.checkpoint?.();
    phone = await options.vapi.bindPhoneNumber(phone.id, assistant.id);
  }

  await persist({ provisioning_state: "provisioned", provisioning_error: undefined });
  return state;
}

function requireResource(value: string, label: string): void {
  if (!value) throw new Error(`${label} was missing from the provider response.`);
}

function webhooksMatch(number: TwilioNumber, desired: TwilioWebhookConfig): boolean {
  return (desired.voiceUrl === undefined || number.voiceUrl === desired.voiceUrl)
    && (desired.voiceFallbackUrl === undefined || number.voiceFallbackUrl === desired.voiceFallbackUrl)
    && (desired.statusCallback === undefined || number.statusCallback === desired.statusCallback);
}

function containsDesired(actual: unknown, desired: unknown): boolean {
  if (desired === null || typeof desired !== "object") return Object.is(actual, desired);
  if (Array.isArray(desired)) {
    return Array.isArray(actual) && desired.length === actual.length
      && desired.every((item, index) => containsDesired(actual[index], item));
  }
  if (!actual || typeof actual !== "object") return false;
  return Object.entries(desired as Record<string, unknown>)
    .every(([key, value]) => containsDesired((actual as Record<string, unknown>)[key], value));
}