import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendNotificationOnce } from "../src/lib/portal/notifications";
import { readDb } from "../src/lib/portal/store";

let root = "";
beforeEach(async () => { root = await mkdtemp(path.join(os.tmpdir(), "voice-notify-")); process.env.PORTAL_DATA_DIR = root; });
afterEach(async () => { delete process.env.PORTAL_DATA_DIR; await rm(root, { recursive: true, force: true }); });

describe("transactional webhook notification claims", () => {
  it("invokes the provider exactly once across concurrent duplicate deliveries", async () => {
    const provider = vi.fn(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
    const results = await Promise.all(Array.from({ length: 12 }, () => sendNotificationOnce("vapi-lead", "call-123", provider)));
    expect(provider).toHaveBeenCalledTimes(1);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await readDb()).idempotency_records).toHaveLength(1);
  });

  it("releases a failed claim so a later webhook delivery can retry safely", async () => {
    const failed = vi.fn(async () => { throw new Error("mail unavailable"); });
    await expect(sendNotificationOnce("voice-usage", "agent:period:100", failed)).rejects.toThrow("mail unavailable");
    expect((await readDb()).idempotency_records).toHaveLength(0);
    const retry = vi.fn(async () => undefined);
    expect(await sendNotificationOnce("voice-usage", "agent:period:100", retry)).toBe(true);
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
