#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { STAGING_DIR, SHIP_RELEASES_DIR, SHIP_SHELL_DIR } from "./lib/paths.mjs";
import { validateReleaseDir, printChecklist } from "./lib/manifest.mjs";
import { exists } from "./lib/fsutil.mjs";

// Simulates "physical transfer to the ship": copying a validated, staged
// release into the Ship Server's public/ tree. Crucially:
//   - MFE release folders are NEVER overwritten (constraint: immutability).
//   - The Shell app IS overwritten, because it is deployed independently
//     of any single MFE release (constraint: activating an MFE release
//     must not require rebuilding/redeploying the Shell).
//   - This step never touches the active manifest — installing a release
//     is separate from activating it.

const release = process.argv[2];
if (!release) {
  console.error("Usage: node scripts/deploy-ship.mjs <release>");
  process.exit(1);
}

const stagingDir = path.join(STAGING_DIR, release);
if (!exists(stagingDir)) {
  console.error(`No staged release found at releases/${release}. Run "pnpm ship:build ${release}" first.`);
  process.exit(1);
}

console.log(`Validating staged release ${release} before transfer...\n`);
const result = validateReleaseDir(stagingDir, release);
printChecklist(release, result);
if (!result.ok) {
  console.error(`\nRefusing to transfer an invalid release to the ship.`);
  process.exit(1);
}

const destDir = path.join(SHIP_RELEASES_DIR, release);
if (exists(destDir)) {
  console.error(
    `\nRelease ${release} is already installed on the ship at mfe/releases/${release}/. ` +
      `Installed releases are immutable and cannot be overwritten.`,
  );
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
for (const mfe of ["bookings", "dining", "payment"]) {
  fs.cpSync(path.join(stagingDir, mfe), path.join(destDir, mfe), { recursive: true });
}
fs.cpSync(path.join(stagingDir, "manifest.json"), path.join(destDir, "manifest.json"));

fs.rmSync(SHIP_SHELL_DIR, { recursive: true, force: true });
fs.cpSync(path.join(stagingDir, "shell"), SHIP_SHELL_DIR, { recursive: true });

console.log(`\nRelease ${release} installed on the ship at mfe/releases/${release}/ (immutable).`);
console.log(`Shell app deployed to the ship (shell is deployed independently of MFE releases).`);
console.log(`\nRelease ${release} is installed but NOT yet active.`);
console.log(`Next: pnpm ship:activate ${release}`);
