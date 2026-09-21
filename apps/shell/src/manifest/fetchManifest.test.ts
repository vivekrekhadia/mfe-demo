import { describe, expect, it } from "vitest";
import { fetchManifest } from "./fetchManifest";

const validManifest = {
  release: "2026.09.01",
  activatedAt: "2026-09-01T00:00:00.000Z",
  mfes: {
    bookings: { version: "1.0.0", url: "/mfe/releases/2026.09.01/bookings/remoteEntry.js" },
    dining: { version: "1.0.0", url: "/mfe/releases/2026.09.01/dining/remoteEntry.js" },
    payment: { version: "1.0.0", url: "/mfe/releases/2026.09.01/payment/remoteEntry.js" },
  },
};

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as Response) as typeof fetch;
}

describe("fetchManifest", () => {
  it("loads a valid manifest served by the Ship Server", async () => {
    const result = await fetchManifest(fakeFetch(200, validManifest));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.release).toBe("2026.09.01");
    }
  });

  it("reports an error when the Ship Server responds with a non-OK status", async () => {
    const result = await fetchManifest(fakeFetch(503, {}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/503/);
  });

  it("rejects a manifest that fails schema validation (e.g. missing an MFE)", async () => {
    const { payment: _payment, ...restMfes } = validManifest.mfes;
    const result = await fetchManifest(fakeFetch(200, { ...validManifest, mfes: restMfes }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schema/i);
  });

  it("handles the network being unreachable (offline / Ship Server down)", async () => {
    const throwingFetch = (async () => {
      throw new Error("network request failed");
    }) as unknown as typeof fetch;
    const result = await fetchManifest(throwingFetch);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/network request failed/);
  });
});
