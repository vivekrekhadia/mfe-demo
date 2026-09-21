#!/usr/bin/env node
import fs from "node:fs";
import { ACTIVE_MANIFEST_PATH, SHIP_RELEASES_DIR } from "./lib/paths.mjs";
import { readHistory } from "./lib/manifest.mjs";
import { tryReadJson, exists } from "./lib/fsutil.mjs";

const manifest = tryReadJson(ACTIVE_MANIFEST_PATH);
const history = readHistory();
const installed = exists(SHIP_RELEASES_DIR) ? fs.readdirSync(SHIP_RELEASES_DIR).filter((n) => !n.startsWith(".")) : [];

console.log("Ship release status\n--------------------");
console.log(`Active release: ${manifest ? manifest.release : "(none — no manifest activated yet)"}`);
if (manifest) {
  console.log(`Activated at:   ${manifest.activatedAt}`);
  console.log("MFE versions:");
  for (const [name, entry] of Object.entries(manifest.mfes)) {
    console.log(`  - ${name}: ${entry.version}  (${entry.url})`);
  }
}
console.log(`\nInstalled releases on ship: ${installed.length ? installed.join(", ") : "(none)"}`);
console.log(`Activation history: ${history.releases.length ? history.releases.join(" -> ") : "(none)"}`);
console.log(`Current position in history: ${history.currentIndex}`);
