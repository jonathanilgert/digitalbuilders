import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasLeadDestination, parseVoiceStep } from "../src/lib/voice/intake-schema.ts";
import { getVoiceMedia, putVoiceMedia } from "../src/lib/voice/media-storage.ts";

const checks = [];
function check(name, fn) {
  checks.push(Promise.resolve().then(fn).then(() => console.log(`PASS ${name}`)));
}

check("all six schemas accept defaults", () => {
  for (let step = 1; step <= 6; step += 1) assert.equal(parseVoiceStep(step, {}).success, true, `step ${step}`);
  assert.deepEqual(parseVoiceStep(1, {}).data, { routing_mode: "forward_no_answer", carrier: "Not sure", rings_before_forward: 4 });
  assert.equal(parseVoiceStep(2, {}).data.coverage, "overflow_and_after_hours");
  assert.equal(parseVoiceStep(3, {}).data.primary_job, "message");
  assert.equal(parseVoiceStep(4, {}).data.pricing_policy, "never_quote");
  assert.equal(parseVoiceStep(5, {}).data.delivery, "immediate");
  assert.equal(parseVoiceStep(6, {}).data.recording_notice, true);
});

check("bounded list and enum validation", () => {
  assert.equal(parseVoiceStep(3, { qualifying_questions: "1\n2\n3\n4\n5\n6" }).success, false);
  assert.equal(parseVoiceStep(3, { transfer_targets: [1, 2, 3, 4].map((number) => ({ number: String(number) })) }).success, false);
  assert.equal(parseVoiceStep(5, { sms_to: "1,2,3,4" }).success, false);
  assert.equal(parseVoiceStep(3, { calendar_type: "unsupported" }).success, false);
  assert.equal(parseVoiceStep(5, { crm_webhook: "not a url" }).success, false);
});

check("lead destination accepts either channel", () => {
  assert.equal(hasLeadDestination({}), false);
  assert.equal(hasLeadDestination({ sms_to: "4035550100" }), true);
  assert.equal(hasLeadDestination({ email_to: ["owner@example.com"] }), true);
});

check("mobile recording fallbacks and disclosure UI are present", async () => {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const recorder = await readFile(path.join(root, "../src/components/portal/voice-recorder.tsx"), "utf8");
  const form = await readFile(path.join(root, "../src/components/portal/voice-step-form.tsx"), "utf8");
  const picker = await readFile(path.join(root, "../src/components/portal/voice-picker.tsx"), "utf8");
  assert.match(recorder, /audio\/mp4;codecs=mp4a\.40\.2/);
  assert.match(recorder, /audio\/webm;codecs=opus/);
  assert.match(recorder, /active\.start\(250\).*active\.start\(\)/s);
  assert.match(recorder, /Upload audio/);
  assert.match(form, /A few optional extras — business-name pronunciation/);
  assert.match(form, /ai_disclosure_acknowledged/);
  assert.match(form, /setTimeout\(.*800/s);
  assert.match(form, /queue\.current = queue\.current\.catch.*\.then\(run\)/s);
  assert.match(picker, /speechSynthesis\.speak/);
  assert.equal((picker.match(/id: "(?:warm_clear|calm_professional|bright_friendly|steady_confident)"/g) || []).length, 4);
  assert.doesNotMatch(form, /type="checkbox"[^>]*ai disclosure toggle/i);
});

check("local media round trip, key safety, and production honesty", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "voice-intake-check-"));
  const oldRoot = process.env.PORTAL_DATA_DIR;
  const oldEnv = process.env.NODE_ENV;
  process.env.PORTAL_DATA_DIR = root;
  process.env.NODE_ENV = "test";
  try {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await putVoiceMedia("agent/memo.webm", bytes, "audio/webm");
    assert.deepEqual(Array.from(await getVoiceMedia("agent/memo.webm")), Array.from(bytes));
    await assert.rejects(() => putVoiceMedia("../escape", bytes, "audio/webm"), /Invalid voice media key/);
    process.env.NODE_ENV = "production";
    await assert.rejects(() => putVoiceMedia("agent/production.webm", bytes, "audio/webm"), /R2\/S3 is not configured/);
  } finally {
    if (oldRoot === undefined) delete process.env.PORTAL_DATA_DIR; else process.env.PORTAL_DATA_DIR = oldRoot;
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
    await rm(root, { recursive: true, force: true });
  }
});

await Promise.all(checks);
console.log(`PASS ${checks.length} focused voice-intake checks`);
