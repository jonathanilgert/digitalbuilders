import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import { rotateMagicLink, setStatus, setVoiceStatus } from "@/lib/portal/store";
import { sendMagicLink } from "@/lib/portal/mail";
import { AdminActionValidationError, parseAdminClientAction } from "@/lib/portal/admin-actions";
import { publicUrl } from "@/lib/portal/urls";
import { runVoiceProvisioning } from "@/lib/voice/provision-service";

export async function POST(req: Request) {
  await requireAdmin();
  let payload;
  try {
    payload = parseAdminClientAction(await req.formData());
  } catch (error) {
    if (error instanceof AdminActionValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
  if (payload.action === "status") await setStatus(payload.clientId, payload.status, payload.note);
  else if (payload.action === "voice_status") await setVoiceStatus(payload.voiceAgentId, payload.status);
  else if (payload.action === "voice_provision") await runVoiceProvisioning(payload.voiceAgentId);
  else {
    const client = await rotateMagicLink(payload.email);
    if (client) await sendMagicLink(client);
  }
  return NextResponse.redirect(publicUrl("/admin", req), 303);
}
