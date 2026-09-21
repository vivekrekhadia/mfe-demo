#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { SHIP_RELEASES_DIR } from "./lib/paths.mjs";
import { exists } from "./lib/fsutil.mjs";

// Demo-only tool: simulates a release that was successfully transferred and
// installed, but is corrupt or incomplete (e.g. a partial copy) — so that
// `pnpm ship:activate <release>` demonstrably refuses to activate it and
// the previously active release keeps running (README "bad release" demo).

const release = process.argv[2];
const mfe = process.argv[3] ?? "dining";

if (!release) {
  console.error("Usage: node scripts/break-release.mjs <release> [mfe=dining]");
  process.exit(1);
}

const remoteEntry = path.join(SHIP_RELEASES_DIR, release, mfe, "remoteEntry.js");
if (!exists(remoteEntry)) {
  console.error(`Nothing to break: ${remoteEntry} does not exist (already missing, or release not installed).`);
  process.exit(1);
}

fs.renameSync(remoteEntry, `${remoteEntry}.corrupted`);
console.log(`Simulated corruption: removed ${mfe}/remoteEntry.js from installed release ${release}.`);
console.log(`Try: pnpm ship:activate ${release}   (this should now fail validation)`);
