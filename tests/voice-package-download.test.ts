import { describe, expect, it, vi } from "vitest";
import { packageDownloadResponse } from "../src/lib/voice/package-service";

describe("protected voice package downloads", () => {
  const db = {
    voice_agents: [
      { id: "voice_owned", client_id: "client_1" },
      { id: "voice_other", client_id: "client_2" },
    ],
  };

  it("returns an owned artifact with safe attachment headers", async () => {
    const load = vi.fn(async () => new Uint8Array(Buffer.from("package contents")));
    const response = await packageDownloadResponse("client_1", "voice_owned", "knowledge", db, load);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="knowledge.md"');
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toBe("package contents");
    expect(load).toHaveBeenCalledWith("voice_owned", "knowledge");
  });

  it("does not reveal or load another client's package", async () => {
    const load = vi.fn(async () => new Uint8Array());
    const response = await packageDownloadResponse("client_1", "voice_other", "assistant", db, load);
    expect(response.status).toBe(404);
    expect(load).not.toHaveBeenCalled();
  });

  it.each([
    ["../voice_owned", "assistant"],
    ["voice_owned", "../assistant"],
    ["voice_owned", "assistant.json"],
    ["voice_owned/other", "brief"],
  ])("rejects traversal/non-allowlisted parameters (%s, %s)", async (agentId, key) => {
    const load = vi.fn(async () => new Uint8Array());
    const response = await packageDownloadResponse("client_1", agentId, key, db, load);
    expect(response.status).toBe(400);
    expect(load).not.toHaveBeenCalled();
  });

  it("maps missing storage to a private 404", async () => {
    const response = await packageDownloadResponse("client_1", "voice_owned", "briefPdf", db, async () => {
      throw new Error("missing");
    });
    expect(response.status).toBe(404);
  });
});
