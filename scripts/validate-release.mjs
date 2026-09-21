#!/usr/bin/env node
import path from "node:path";
import { STAGING_DIR, SHIP_RELEASES_DIR, SHIP_SHELL_DIR } from "./lib/paths.mjs";
import { validateReleaseDir, printChecklist, readHistory } from "./lib/manifest.mjs";
import { exists } from "./lib/fsutil.mjs";

// Can validate either a shore-side staged release (releases/<release>) or
// a release already installed on the ship (apps/ship-server/public/mfe/releases/<release>).
// Defaults to whichever release is currently active if none is given.

const args = process.argv.slice(2);
let release = args.find((a) => !a.startsWith("--"));
const useStaging = args.includes("--staged");

if (!release) {
  const history = readHistory();
  release = history.releases[history.currentIndex];
  if (!release) {
    console.error("No release specified and no active release found. Usage: node scripts/validate-release.mjs <release> [--staged]");
    process.exit(1);
  }
  console.log(`No release specified — validating the currently active release (${release}).`);
}

const dir = useStaging ? path.join(STAGING_DIR, release) : path.join(SHIP_RELEASES_DIR, release);
if (!exists(dir)) {
  console.error(`Release directory not found: ${dir}`);
  process.exit(1);
}

const result = validateReleaseDir(dir, release, useStaging ? {} : { shellDir: SHIP_SHELL_DIR });
printChecklist(release, result);
process.exit(result.ok ? 0 : 1);
