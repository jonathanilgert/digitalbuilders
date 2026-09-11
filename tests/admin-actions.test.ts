import { describe, expect, it } from "vitest";
import { AdminActionValidationError, parseAdminClientAction } from "../src/lib/portal/admin-actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("admin client action validation", () => {
  it("accepts only explicit client and voice status enums", () => {
    expect(parseAdminClientAction(form({ action: "status", client_id: "client_1", status: "live", note: "ok" }))).toEqual({ action: "status", clientId: "client_1", status: "live", note: "ok" });
    expect(parseAdminClientAction(form({ action: "voice_status", voice_agent_id: "voice_1", status: "paused" }))).toEqual({ action: "voice_status", voiceAgentId: "voice_1", status: "paused" });
    expect(() => parseAdminClientAction(form({ action: "status", client_id: "client_1", status: "deleted" }))).toThrow(AdminActionValidationError);
    expect(() => parseAdminClientAction(form({ action: "voice_status", voice_agent_id: "voice_1", status: "suspended" }))).toThrow(/Invalid voice-agent status/);
  });

  it("rejects unknown actions and missing action-specific identifiers", () => {
    expect(() => parseAdminClientAction(form({ action: "delete_everything", client_id: "client_1" }))).toThrow(/Invalid admin action/);
    expect(() => parseAdminClientAction(form({ action: "voice_provision" }))).toThrow(/Voice agent ID is required/);
    expect(() => parseAdminClientAction(form({ action: "resend", email: "not-an-email" }))).toThrow(/Invalid email/);
  });
});
