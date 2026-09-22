#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Render's Build Command (see render.yaml) runs this. It wraps the exact
// same build -> deploy -> activate pipeline `pnpm ship:build` /
// `pnpm ship:deploy` / `pnpm ship:activate` run manually, so a Render
// deploy goes through the identical validate-before-promote path a
// deliberate manual ship promotion does — see scripts/build-release.mjs,
// deploy-ship.mjs, activate-release.mjs.
//
// Releases are immutable and must be uniquely named — fine for a manual
// promotion, but "redeploy on every push" needs a fresh name every run.
// RENDER_GIT_COMMIT (set by Render during a build) makes the id traceable
// back to the exact commit; a short random suffix guarantees it's unique
// even when Render retries a build for the same commit. Falls back to a
// timestamp for a local dry run (`node scripts/deploy-render.mjs`) where
// that env var isn't set.
const commit = process.env.RENDER_GIT_COMMIT?.slice(0, 12) ?? "local";
const suffix = crypto.randomBytes(3).toString("hex");
const releaseId = `render-${commit}-${suffix}`;

console.log(`Deploying release ${releaseId} for Render...\n`);

function run(script, args = []) {
  execFileSync("node", [path.join(__dirname, script), ...args], { stdio: "inherit" });
}

run("build-release.mjs", [releaseId]);
run("deploy-ship.mjs", [releaseId]);
run("activate-release.mjs", [releaseId]);

console.log(`\nRelease ${releaseId} built, deployed, and activated.`);
