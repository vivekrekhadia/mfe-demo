#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, APPS } from "./lib/paths.mjs";
import { readJson } from "./lib/fsutil.mjs";

// One-shot setup for the demo in the README: builds and deploys TWO real
// releases, with a visible source difference in Bookings between them
// (section 21), and activates only the first one — so the reviewer can
// run the exact "deploy release 2 -> activate -> rollback" walkthrough
// themselves without needing to hand-build anything.

const RELEASE_1 = "2026.09.01";
const RELEASE_2 = "2026.09.10";

function run(script, ...args) {
  console.log(`\n$ node scripts/${script} ${args.join(" ")}`);
  execFileSync("node", [path.join(ROOT, "scripts", script), ...args], { cwd: ROOT, stdio: "inherit" });
}

const bookingsAppPath = path.join(APPS.bookings, "src", "BookingsApp.tsx");
const bookingsPkgPath = path.join(APPS.bookings, "package.json");
const DINNER_MARKER = "Dinner reservation confirmed";

console.log(`=== Seeding release ${RELEASE_1} (baseline Bookings) ===`);
run("build-release.mjs", RELEASE_1);
run("deploy-ship.mjs", RELEASE_1);
run("activate-release.mjs", RELEASE_1);

console.log(`\n=== Evolving Bookings MFE (independently of Dining/Payment/Shell) ===`);
let bookingsSource = fs.readFileSync(bookingsAppPath, "utf-8");
if (!bookingsSource.includes(DINNER_MARKER)) {
  bookingsSource = bookingsSource.replace(
    '<div>Check-out: {b.checkOut}</div>',
    '<div>Check-out: {b.checkOut}</div>\n          <div className="mfe-note">Dinner reservation confirmed</div>',
  );
  fs.writeFileSync(bookingsAppPath, bookingsSource, "utf-8");
  console.log(`Updated ${path.relative(ROOT, bookingsAppPath)}: added "${DINNER_MARKER}" line.`);
}

const bookingsPkg = readJson(bookingsPkgPath);
if (bookingsPkg.version === "1.0.0") {
  bookingsPkg.version = "1.1.0";
  fs.writeFileSync(bookingsPkgPath, JSON.stringify(bookingsPkg, null, 2) + "\n", "utf-8");
  console.log(`Bumped ${path.relative(ROOT, bookingsPkgPath)} version to 1.1.0.`);
}

console.log(`\n=== Seeding release ${RELEASE_2} (Bookings v1.1.0, Dining/Payment unchanged) ===`);
run("build-release.mjs", RELEASE_2);
run("deploy-ship.mjs", RELEASE_2);

console.log(`\nSeeding complete.`);
console.log(`Release ${RELEASE_1} is ACTIVE. Release ${RELEASE_2} is installed but not yet active.`);
console.log(`\nDemo next steps (see README "Demo: release rollout and rollback"):`);
console.log(`  pnpm ship:server            # start the Ship Server, open http://localhost:4173`);
console.log(`  pnpm ship:activate ${RELEASE_2}   # then refresh the browser`);
console.log(`  pnpm ship:rollback           # then refresh the browser again`);
