#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, STAGING_DIR, APPS, MFE_NAMES } from "./lib/paths.mjs";
import { readJson, writeJsonAtomic, exists } from "./lib/fsutil.mjs";

// This script plays the role of "CI/CD: build all MFEs" from the shore-side
// pipeline in the README's deployment diagram. It never touches the ship
// server — it only produces a self-contained, versioned artifact under
// releases/<release>/, ready to be transferred (see deploy-ship.mjs).

const release = process.argv[2];
if (!release) {
  console.error("Usage: node scripts/build-release.mjs <release>  e.g. 2026.09.10");
  process.exit(1);
}

const releaseStagingDir = path.join(STAGING_DIR, release);
if (exists(releaseStagingDir)) {
  console.error(
    `Release "${release}" is already staged at releases/${release}. Releases are immutable — ` +
      `pick a new release identifier, or remove the staging directory if this was a mistake.`,
  );
  process.exit(1);
}

console.log(`Building release ${release}...\n`);

for (const appDir of [APPS.shell, APPS.bookings, APPS.dining, APPS.payment]) {
  const pkg = readJson(path.join(appDir, "package.json"));
  console.log(`> building ${pkg.name}@${pkg.version}`);
  execFileSync("pnpm", ["--filter", pkg.name, "run", "build"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

fs.mkdirSync(releaseStagingDir, { recursive: true });

const versions = {};
for (const [mfe, appDir] of Object.entries(APPS)) {
  if (mfe === "shell") continue;
  const pkg = readJson(path.join(appDir, "package.json"));
  versions[mfe] = pkg.version;
  fs.cpSync(path.join(appDir, "dist"), path.join(releaseStagingDir, mfe), { recursive: true });
}
fs.cpSync(path.join(APPS.shell, "dist"), path.join(releaseStagingDir, "shell"), { recursive: true });

const manifest = {
  release,
  mfes: Object.fromEntries(
    MFE_NAMES.map((mfe) => [
      mfe,
      { version: versions[mfe], url: `/mfe/releases/${release}/${mfe}/remoteEntry.js` },
    ]),
  ),
};
writeJsonAtomic(path.join(releaseStagingDir, "manifest.json"), manifest);

console.log(`\nRelease ${release} built and staged at releases/${release}/`);
console.log("MFE versions:", versions);
console.log(`\nNext: pnpm ship:package ${release}   (optional, produces a tar.gz + checksum)`);
console.log(`      pnpm ship:deploy ${release}    (copies the release onto the Ship Server)`);
