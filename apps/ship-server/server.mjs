import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The Ship Server represents the cruise ship's central/local server: the
// ONLY thing the Shell and MFEs talk to at runtime. Nothing in this file
// reaches out to the internet — it is a static file server plus one mock
// local API, which is exactly what must keep working with no uplink.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4173);
const PUBLIC_DIR = path.join(__dirname, "public");
const RELEASES_DIR = path.join(PUBLIC_DIR, "mfe", "releases");
const SHELL_DIR = path.join(PUBLIC_DIR, "shell");

const app = express();
app.disable("x-powered-by");

// The active manifest is small, mutable, and must always reflect the
// latest atomic activate/rollback — never let a browser or proxy cache it.
app.get("/config/mfe-manifest.json", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Installed releases are immutable by construction (see scripts/deploy-ship.mjs),
// so it is safe — and realistic for a ship's local CDN — to cache them hard.
app.use(
  "/mfe/releases",
  express.static(RELEASES_DIR, { immutable: true, maxAge: "365d" }),
);

// Deliberately fake, deliberately local: proves that at least basic session
// state can be served without any cloud identity provider. See README
// "Authentication" for why this is NOT a full auth solution.
app.get("/api/session", (req, res) => {
  res.json({ user: "J. Rivera (Guest 4021)", authenticatedVia: "ship-local-mock-session" });
});

app.use(express.static(PUBLIC_DIR));
app.use(express.static(SHELL_DIR));

app.get("*", (req, res, next) => {
  if (
    req.path.startsWith("/mfe/") ||
    req.path.startsWith("/config/") ||
    req.path.startsWith("/api/")
  ) {
    return next();
  }
  res.sendFile(path.join(SHELL_DIR, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, () => {
  console.log(`Ship Server listening on http://localhost:${PORT}`);
  console.log(`  Shell:        http://localhost:${PORT}/`);
  console.log(`  Manifest:     http://localhost:${PORT}/config/mfe-manifest.json`);
  console.log(`  Releases:     http://localhost:${PORT}/mfe/releases/`);
  console.log(`  Mock session: http://localhost:${PORT}/api/session`);
});
