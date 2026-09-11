import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getVoiceMedia, putVoiceMedia, voiceMediaStorageConfig } from "../src/lib/voice/media-storage";

const originalEnv = { ...process.env };
let temporaryRoots: string[] = [];

afterEach(async () => {
  process.env = { ...originalEnv };
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
  temporaryRoots = [];
});

describe("private voice media storage configuration", () => {
  it("uses durable PORTAL_DATA_DIR storage in production with private permissions", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "voice-media-"));
    temporaryRoots.push(root);
    process.env = { ...originalEnv, NODE_ENV: "production", PORTAL_DATA_DIR: root };
    delete process.env.S3_BUCKET;
    delete process.env.R2_BUCKET;
    delete process.env.S3_ENDPOINT;
    delete process.env.R2_ENDPOINT;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.R2_SECRET_ACCESS_KEY;

    expect(voiceMediaStorageConfig()).toEqual({ mode: "local", root: path.join(root, "voice-media") });
    await putVoiceMedia("agent-1/memo.webm", new Uint8Array([1, 2, 3]), "audio/webm");
    expect(Array.from(await getVoiceMedia("agent-1/memo.webm"))).toEqual([1, 2, 3]);
    expect((await stat(path.join(root, "voice-media", "agent-1"))).mode & 0o777).toBe(0o700);
    expect((await stat(path.join(root, "voice-media", "agent-1", "memo.webm"))).mode & 0o777).toBe(0o600);
  });

  it("rejects release-relative production storage and partial object-storage config", () => {
    expect(() => voiceMediaStorageConfig({ NODE_ENV: "production" })).toThrow(/PORTAL_DATA_DIR/);
    expect(() => voiceMediaStorageConfig({
      NODE_ENV: "production", PORTAL_DATA_DIR: "/durable/portal", S3_BUCKET: "media-only",
    })).toThrow(/partially configured/);
  });
});
