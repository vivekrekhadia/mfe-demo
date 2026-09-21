#!/usr/bin/env node
import path from "node:path";
import { SHIP_RELEASES_DIR, SHIP_SHELL_DIR, ACTIVE_MANIFEST_PATH } from "./lib/paths.mjs";
import { validateReleaseDir, printChecklist, readHistory, writeHistory } from "./lib/manifest.mjs";
import { writeJsonAtomic } from "./lib/fsutil.mjs";

// Rollback requires NO rebuild: the previous release's assets are still
// sitting, untouched, in its immutable release folder. We only need to
// point the active manifest back at it — the same atomic write used by
// activate-release.mjs.

const history = readHistory();

if (history.currentIndex <= 0) {
  console.error("No previous release available to roll back to.");
  process.exit(1);
}

const targetIndex = history.currentIndex - 1;
const targetRelease = history.releases[targetIndex];

console.log(`Rolling back from ${history.releases[history.currentIndex]} to ${targetRelease}...\n`);

const releaseDir = path.join(SHIP_RELEASES_DIR, targetRelease);
const result = validateReleaseDir(releaseDir, targetRelease, { shellDir: SHIP_SHELL_DIR });
printChecklist(targetRelease, result);

if (!result.ok) {
  console.error(`\nRollback target ${targetRelease} failed validation. Rollback aborted; active release unchanged.`);
  process.exit(1);
}

const activeManifest = {
  release: result.manifest.release,
  activatedAt: new Date().toISOString(),
  mfes: result.manifest.mfes,
};
writeJsonAtomic(ACTIVE_MANIFEST_PATH, activeManifest);

writeHistory({ releases: history.releases, currentIndex: targetIndex });

console.log(`\nRolled back to release ${targetRelease}. No rebuild was performed.`);
console.log(`Refresh the Shell in the browser to see it running release ${targetRelease}.`);
