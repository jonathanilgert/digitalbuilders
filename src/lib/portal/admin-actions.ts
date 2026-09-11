import type { ClientStatus, VoiceAgentStatus } from "./types";

export const CLIENT_STATUSES = ["paid", "in_progress", "ready_to_build", "building", "in_review", "revising", "live", "suspended"] as const satisfies readonly ClientStatus[];
export const VOICE_AGENT_STATUSES = ["paid", "in_progress", "ready_to_build", "building", "test_call", "revising", "live", "cancellation_pending", "paused", "cancelled"] as const satisfies readonly VoiceAgentStatus[];
export const ADMIN_CLIENT_ACTIONS = ["status", "voice_status", "voice_provision", "resend"] as const;

export class AdminActionValidationError extends Error {}

type FormLike = Pick<FormData, "get">;
export type AdminClientAction =
  | { action: "status"; clientId: string; status: ClientStatus; note: string }
  | { action: "voice_status"; voiceAgentId: string; status: VoiceAgentStatus }
  | { action: "voice_provision"; voiceAgentId: string }
  | { action: "resend"; email: string };

function required(value: FormDataEntryValue | null, label: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new AdminActionValidationError(`${label} is required.`);
  return result;
}

export function parseAdminClientAction(form: FormLike): AdminClientAction {
  const action = required(form.get("action"), "Action");
  if (!(ADMIN_CLIENT_ACTIONS as readonly string[]).includes(action)) throw new AdminActionValidationError("Invalid admin action.");
  if (action === "status") {
    const clientId = required(form.get("client_id"), "Client ID");
    const status = required(form.get("status"), "Status");
    if (!(CLIENT_STATUSES as readonly string[]).includes(status)) throw new AdminActionValidationError("Invalid client status.");
    return { action, clientId, status: status as ClientStatus, note: String(form.get("note") || "") };
  }
  if (action === "voice_status") {
    const voiceAgentId = required(form.get("voice_agent_id"), "Voice agent ID");
    const status = required(form.get("status"), "Status");
    if (!(VOICE_AGENT_STATUSES as readonly string[]).includes(status)) throw new AdminActionValidationError("Invalid voice-agent status.");
    return { action, voiceAgentId, status: status as VoiceAgentStatus };
  }
  if (action === "voice_provision") return { action, voiceAgentId: required(form.get("voice_agent_id"), "Voice agent ID") };
  const email = required(form.get("email"), "Email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AdminActionValidationError("Invalid email address.");
  return { action: "resend", email };
}
