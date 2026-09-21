import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function tryReadJson(filePath) {
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

/**
 * Write-then-rename. `fs.renameSync` within the same filesystem is atomic,
 * so any reader (the Ship Server serving a request) either sees the old
 * complete file or the new complete file — never a half-written one.
 */
export function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

export function exists(filePath) {
  return fs.existsSync(filePath);
}

export function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}
