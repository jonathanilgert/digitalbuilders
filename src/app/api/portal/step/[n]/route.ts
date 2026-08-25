import { NextResponse } from "next/server";
import { requireClient } from "@/lib/portal/auth";
import { mutateDb, updateClientStatusFromSteps } from "@/lib/portal/store";
import { notifyReady } from "@/lib/portal/mail";

export async function PATCH(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const client = await requireClient();
  const n = Number((await params).n);
  if (n < 1 || n > 6) return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  const body = await req.json();
  const state = body.state === "complete" ? "complete" : "draft";
  let readyClientId: string | null = null;
  await mutateDb(async (db) => {
    const before = db.clients.find((x) => x.id === client.id)?.status;
    const step = db.steps.find((s) => s.client_id === client.id && s.step_number === n);
    if (!step) return;
    step.data = body.data || {};
    step.state = state;
    step.updated_at = new Date().toISOString();
    if (state === "complete") step.completed_at ||= step.updated_at;
    if (n === 3) {
      const hasMail = Boolean((step.data as { has_domain_email?: unknown }).has_domain_email);
      const c = db.clients.find((x) => x.id === client.id);
      if (c) c.mx_preflight_required = hasMail;
    }
    await updateClientStatusFromSteps(client.id, db);
    const c = db.clients.find((x) => x.id === client.id);
    if (before !== "ready_to_build" && c?.status === "ready_to_build" && !c.ready_notified_at) {
      c.ready_notified_at = new Date().toISOString();
      readyClientId = c.id;
    }
  });
  if (readyClientId) {
    const db = await (await import("@/lib/portal/store")).readDb();
    const c = db.clients.find((x) => x.id === readyClientId);
    if (c?.build_package_generated_at) await notifyReady(c);
  }
  return NextResponse.json({ ok: true, state });
}
