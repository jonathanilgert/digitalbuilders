export type ProviderFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export const DEFAULT_PROVIDER_TIMEOUT_MS = 20_000;

export function withProviderTimeout(init: RequestInit = {}, timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS): RequestInit {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Provider timeout must be a positive number");
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return { ...init, signal };
}

export class ProviderHttpError extends Error {
  constructor(
    readonly provider: "Twilio" | "Vapi",
    readonly status: number,
    message?: string,
  ) {
    super(message ? `${provider} request failed (${status}): ${message}` : `${provider} request failed (${status})`);
    this.name = "ProviderHttpError";
  }
}

export function assertProviderMutationsEnabled(enabled: boolean): void {
  if (!enabled) {
    throw new Error("Provider mutations are disabled. Set VOICE_PROVIDER_MUTATIONS_ENABLED=true to enable them.");
  }
}

export function mutationsEnabledFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VOICE_PROVIDER_MUTATIONS_ENABLED === "true";
}

export async function responseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => undefined);
}

export function safeProviderMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const candidate = record.message ?? record.error;
  // Do not echo arbitrary response objects: they can contain submitted credentials.
  return typeof candidate === "string" ? candidate.slice(0, 300) : undefined;
}