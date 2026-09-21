#!/usr/bin/env node
import path from "node:path";
import { SHIP_RELEASES_DIR, SHIP_SHELL_DIR, ACTIVE_MANIFEST_PATH } from "./lib/paths.mjs";
import {
  validateReleaseDir,
  printChecklist,
  readHistory,
  writeHistory,
  recordActivation,
} from "./lib/manifest.mjs";
import { exists, writeJsonAtomic } from "./lib/fsutil.mjs";

// Atomic activation: a release must already be installed (see deploy-ship.mjs).
// Activating it means re-validating it in place, then swapping the ACTIVE
// manifest file — via write-to-tmp + rename — so the Shell either sees the
// fully-old manifest or the fully-new one, never a partial write.
//
// A failed validation here leaves the currently active manifest completely
// untouched: the ship keeps running whatever was working before.

const release = process.argv[2];
if (!release) {
  console.error("Usage: node scripts/activate-release.mjs <release>");
  process.exit(1);
}

const releaseDir = path.join(SHIP_RELEASES_DIR, release);
if (!exists(releaseDir)) {
  console.error(`Release ${release} is not installed on the ship. Run "pnpm ship:deploy ${release}" first.`);
  process.exit(1);
}

const result = validateReleaseDir(releaseDir, release, { shellDir: SHIP_SHELL_DIR });
printChecklist(release, result);

if (!result.ok) {
  console.error(`\nRelease was NOT activated. The currently active release continues running.`);
  process.exit(1);
}

const activeManifest = {
  release: result.manifest.release,
  activatedAt: new Date().toISOString(),
  mfes: result.manifest.mfes,
};

writeJsonAtomic(ACTIVE_MANIFEST_PATH, activeManifest);

const history = readHistory();
writeHistory(recordActivation(history, release));

console.log(`\nRelease ${release} activated.`);
console.log(`Active manifest written atomically to apps/ship-server/public/config/mfe-manifest.json`);
console.log(`Refresh the Shell in the browser to see it running release ${release}.`);
