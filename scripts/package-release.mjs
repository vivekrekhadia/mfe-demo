#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { STAGING_DIR } from "./lib/paths.mjs";
import { exists, sha256File } from "./lib/fsutil.mjs";

// Demonstrates that a release is something that can be physically handed
// off — packaged into one artifact plus a checksum — rather than an
// abstract "deploy to the cloud" step. See README section on checksums for
// why this is a POC-level integrity check, not a signed-release system.

const release = process.argv[2];
if (!release) {
  console.error("Usage: node scripts/package-release.mjs <release>");
  process.exit(1);
}

const releaseDir = path.join(STAGING_DIR, release);
if (!exists(releaseDir)) {
  console.error(`No staged release found at releases/${release}. Run "pnpm ship:build ${release}" first.`);
  process.exit(1);
}

const tarPath = path.join(STAGING_DIR, `ship-release-${release}.tar.gz`);
const shaPath = `${tarPath}.sha256`;

execFileSync("tar", ["-czf", tarPath, "-C", releaseDir, "."]);

const digest = sha256File(tarPath);
fs.writeFileSync(shaPath, `${digest}  ship-release-${release}.tar.gz\n`, "utf-8");

console.log(`Packaged releases/ship-release-${release}.tar.gz`);
console.log(`SHA-256: ${digest}`);
console.log(`Checksum written to releases/ship-release-${release}.tar.gz.sha256`);
