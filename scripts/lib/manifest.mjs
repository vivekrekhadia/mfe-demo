import path from "node:path";
import { MFE_NAMES, HISTORY_PATH } from "./paths.mjs";
import { exists, fileSize, tryReadJson, readJson, writeJsonAtomic } from "./fsutil.mjs";

/**
 * Validates an installed (or staged) release directory against everything
 * the Shell needs to be able to run it: a manifest, a shell build, and a
 * Module Federation entry point for each MFE with non-trivial content.
 * Returns an ordered checklist so callers can print exactly the kind of
 * report the spec asks for ("✓ manifest.json", "✗ dining remoteEntry.js" ...).
 */
export function validateReleaseDir(releaseDir, expectedRelease, options = {}) {
  const checks = [];
  let manifest = null;
  // On the ship, the Shell is deployed independently of any single MFE
  // release (see deploy-ship.mjs), so it does NOT live inside the
  // per-release folder there — only in the shore-side staging layout does
  // releases/<release>/shell/ exist. Callers validating an installed
  // release pass the Shell's actual (fixed) location explicitly.
  const shellDir = options.shellDir ?? path.join(releaseDir, "shell");

  const manifestPath = path.join(releaseDir, "manifest.json");
  if (!exists(manifestPath)) {
    checks.push({ name: "manifest.json", ok: false, detail: "missing" });
  } else {
    manifest = tryReadJson(manifestPath);
    if (!manifest) {
      checks.push({ name: "manifest.json", ok: false, detail: "not valid JSON" });
    } else if (manifest.release !== expectedRelease) {
      checks.push({
        name: "manifest.json",
        ok: false,
        detail: `release field "${manifest.release}" does not match "${expectedRelease}"`,
      });
    } else {
      checks.push({ name: "manifest.json", ok: true });
    }
  }

  const shellIndex = path.join(shellDir, "index.html");
  checks.push({ name: "shell", ok: exists(shellIndex), detail: exists(shellIndex) ? undefined : "shell/index.html missing" });

  for (const mfe of MFE_NAMES) {
    const remoteEntry = path.join(releaseDir, mfe, "remoteEntry.js");
    const ok = exists(remoteEntry) && fileSize(remoteEntry) > 0;
    checks.push({
      name: `${mfe} remoteEntry.js`,
      ok,
      detail: ok ? undefined : `${mfe}/remoteEntry.js missing or empty`,
    });

    if (manifest && manifest.mfes && manifest.mfes[mfe]) {
      const entry = manifest.mfes[mfe];
      const entryOk = typeof entry.version === "string" && typeof entry.url === "string" && entry.url.includes(expectedRelease);
      checks.push({
        name: `${mfe} manifest entry`,
        ok: entryOk,
        detail: entryOk ? undefined : `manifest entry for ${mfe} is missing version/url or points at the wrong release`,
      });
    } else if (manifest) {
      checks.push({ name: `${mfe} manifest entry`, ok: false, detail: `manifest.json has no entry for ${mfe}` });
    }
  }

  const allAssetsOk = checks.filter((c) => c.name.endsWith("remoteEntry.js")).every((c) => c.ok);
  checks.push({ name: "all required assets", ok: allAssetsOk });

  const ok = checks.every((c) => c.ok);
  return { ok, checks, manifest };
}

export function printChecklist(release, result) {
  console.log(`Validating release ${release}...\n`);
  for (const check of result.checks) {
    const mark = check.ok ? "✓" : "✗";
    const detail = !check.ok && check.detail ? ` — ${check.detail}` : "";
    console.log(`${mark} ${check.name}${detail}`);
  }
  console.log();
  if (result.ok) {
    console.log("Release validation successful.");
  } else {
    console.log("Release validation failed.");
  }
}

export function readHistory() {
  const data = tryReadJson(HISTORY_PATH);
  if (!data || !Array.isArray(data.releases)) {
    return { releases: [], currentIndex: -1 };
  }
  return data;
}

export function writeHistory(history) {
  writeJsonAtomic(HISTORY_PATH, history);
}

/** Records a newly-activated release, truncating any redo history — standard back/forward stack semantics. */
export function recordActivation(history, release) {
  const next = { releases: [...history.releases], currentIndex: history.currentIndex };
  if (next.releases[next.currentIndex] === release) {
    return next; // re-activating the same release that's already current is a no-op on history
  }
  next.releases = next.releases.slice(0, next.currentIndex + 1);
  next.releases.push(release);
  next.currentIndex = next.releases.length - 1;
  return next;
}

export function readActiveManifest(activeManifestPath) {
  return tryReadJson(activeManifestPath);
}

export { readJson };
