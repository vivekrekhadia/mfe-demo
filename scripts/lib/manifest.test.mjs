import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { validateReleaseDir, recordActivation } from "./manifest.mjs";

function writeManifest(dir, release) {
  const manifest = {
    release,
    mfes: {
      bookings: { version: "1.0.0", url: `/mfe/releases/${release}/bookings/remoteEntry.js` },
      dining: { version: "1.0.0", url: `/mfe/releases/${release}/dining/remoteEntry.js` },
      payment: { version: "1.0.0", url: `/mfe/releases/${release}/payment/remoteEntry.js` },
    },
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
}

function makeCompleteRelease(dir, release) {
  fs.mkdirSync(path.join(dir, "shell"), { recursive: true });
  fs.writeFileSync(path.join(dir, "shell", "index.html"), "<html></html>");
  for (const mfe of ["bookings", "dining", "payment"]) {
    fs.mkdirSync(path.join(dir, mfe), { recursive: true });
    fs.writeFileSync(path.join(dir, mfe, "remoteEntry.js"), "export default {};");
  }
  writeManifest(dir, release);
}

describe("validateReleaseDir", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mfe-release-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("passes a complete, correctly-versioned release", () => {
    makeCompleteRelease(tmpDir, "2026.09.10");
    const result = validateReleaseDir(tmpDir, "2026.09.10");
    expect(result.ok).toBe(true);
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it("fails a release missing an MFE's remoteEntry.js", () => {
    makeCompleteRelease(tmpDir, "2026.09.10");
    fs.rmSync(path.join(tmpDir, "dining", "remoteEntry.js"));
    const result = validateReleaseDir(tmpDir, "2026.09.10");
    expect(result.ok).toBe(false);
    const diningCheck = result.checks.find((c) => c.name === "dining remoteEntry.js");
    expect(diningCheck.ok).toBe(false);
  });

  it("fails a release with no manifest.json at all", () => {
    fs.mkdirSync(path.join(tmpDir, "shell"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "shell", "index.html"), "<html></html>");
    const result = validateReleaseDir(tmpDir, "2026.09.10");
    expect(result.ok).toBe(false);
    expect(result.checks.find((c) => c.name === "manifest.json").ok).toBe(false);
  });

  it("fails a release whose manifest.json points at a different release", () => {
    makeCompleteRelease(tmpDir, "2026.09.01");
    const result = validateReleaseDir(tmpDir, "2026.09.10");
    expect(result.ok).toBe(false);
  });
});

describe("recordActivation (rollback history stack)", () => {
  it("appends a new release and truncates any redo history", () => {
    let history = { releases: [], currentIndex: -1 };
    history = recordActivation(history, "2026.09.01");
    expect(history).toEqual({ releases: ["2026.09.01"], currentIndex: 0 });

    history = recordActivation(history, "2026.09.10");
    expect(history).toEqual({ releases: ["2026.09.01", "2026.09.10"], currentIndex: 1 });
  });

  it("keeps the previous release in history so rollback can reach it", () => {
    let history = { releases: [], currentIndex: -1 };
    history = recordActivation(history, "2026.09.01");
    history = recordActivation(history, "2026.09.10");
    // Simulate a rollback: currentIndex moves back, but the releases array
    // (and therefore "2026.09.01"'s installed assets) is never deleted.
    const rolledBackIndex = history.currentIndex - 1;
    expect(history.releases[rolledBackIndex]).toBe("2026.09.01");
    expect(history.releases).toContain("2026.09.10");
  });

  it("is a no-op when re-activating the already-current release", () => {
    let history = { releases: [], currentIndex: -1 };
    history = recordActivation(history, "2026.09.01");
    const again = recordActivation(history, "2026.09.01");
    expect(again).toEqual(history);
  });
});
