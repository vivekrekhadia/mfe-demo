import { describe, expect, it } from "vitest";
import { isMfeManifest } from "./index";

const validManifest = {
  release: "2026.09.10",
  activatedAt: "2026-09-10T08:00:00.000Z",
  mfes: {
    bookings: { version: "1.1.0", url: "/mfe/releases/2026.09.10/bookings/remoteEntry.js" },
    dining: { version: "1.0.0", url: "/mfe/releases/2026.09.10/dining/remoteEntry.js" },
    payment: { version: "1.0.0", url: "/mfe/releases/2026.09.10/payment/remoteEntry.js" },
  },
};

describe("isMfeManifest", () => {
  it("accepts a fully-formed manifest", () => {
    expect(isMfeManifest(validManifest)).toBe(true);
  });

  it("rejects a manifest missing an MFE entry", () => {
    const { payment: _payment, ...restMfes } = validManifest.mfes;
    const broken = { ...validManifest, mfes: restMfes };
    expect(isMfeManifest(broken)).toBe(false);
  });

  it("rejects a manifest with a non-string version", () => {
    const broken = {
      ...validManifest,
      mfes: { ...validManifest.mfes, bookings: { version: 1, url: "/x" } },
    };
    expect(isMfeManifest(broken)).toBe(false);
  });

  it("rejects a manifest missing the release field", () => {
    const { release: _release, ...rest } = validManifest;
    expect(isMfeManifest(rest)).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(isMfeManifest(null)).toBe(false);
    expect(isMfeManifest("not a manifest")).toBe(false);
    expect(isMfeManifest(undefined)).toBe(false);
  });
});
