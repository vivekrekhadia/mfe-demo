import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authenticate, createSession, getSession, destroySession } from "./lib/auth.mjs";

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
// Render (and most Node hosts) terminate TLS at a proxy in front of this
// process and forward plain HTTP internally, with the original protocol in
// X-Forwarded-Proto. Without trusting that proxy, req.secure is always
// false here even when the visitor is genuinely on https, and the session
// cookie below would either never get the Secure flag it should have in
// production, or would need a hardcoded assumption about the hosting
// environment. `1` trusts exactly one hop (Render's own edge) — see
// https://expressjs.com/en/guide/behind-proxies.html.
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

const SESSION_COOKIE = "ship_session";

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

// Real (if deliberately simple) local session check: 200 while the
// ship_session cookie names a live, unexpired session; 401 otherwise. No
// cloud identity provider involved — see README "Authentication" for why
// that's a real architectural limit of this POC, not just a stub.
app.get("/api/session", (req, res) => {
  const session = getSession(req.cookies[SESSION_COOKIE]);
  if (!session) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  res.json({ user: session.user, authenticatedVia: "ship-local-session" });
});

// Owned by the sign-in MFE's form, not the Shell — this endpoint is the
// only place a password is ever handled, even though (deliberately, for
// this demo — see lib/auth.mjs) it never actually checks it against
// anything: any non-empty username/password signs in as that username. On
// success, issues an opaque server-side session token as an httpOnly
// cookie (never exposed to page JS, so an XSS in any MFE can't read or
// exfiltrate it) — that part is real, not a demo shortcut. `secure` is set
// from req.secure (true behind Render's proxy thanks to `trust proxy`
// above, false for local http) rather than hardcoded either way, so the
// exact same code runs correctly ship-local and on a real public host.
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const displayName = authenticate(username, password);
  if (!displayName) {
    res.status(401).json({ error: "username and password are required" });
    return;
  }
  const token = createSession(displayName);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: req.secure, path: "/" });
  res.json({ user: displayName, authenticatedVia: "ship-local-session" });
});

app.post("/api/auth/logout", (req, res) => {
  destroySession(req.cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, { sameSite: "lax", secure: req.secure, path: "/" });
  res.status(204).end();
});

// Any endpoint an MFE calls that should require a signed-in user (not just
// /api/session, which exists purely for the Shell's own auth check) goes
// through this. Deliberately a plain function, not app.use(...) mounted
// globally: this project has exactly one protected data endpoint so far
// (see /api/crew-log below) and mounting it globally would also gate
// /api/session and /api/auth/* themselves, which must stay reachable while
// unauthenticated.
function requireAuth(req, res, next) {
  const session = getSession(req.cookies[SESSION_COOKIE]);
  if (!session) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  req.session = session;
  next();
}

// Demo-only endpoint proving the session cookie set by /api/auth/login
// really does gate access, from any MFE, not just the Shell's own
// /api/session check: any same-origin fetch(..., { credentials: "include" })
// carries the httpOnly ship_session cookie automatically (the browser
// attaches it, no MFE code ever touches the token itself), while a request
// that omits credentials looks — from this server's perspective — no
// different from an unauthenticated visitor. See BookingsList.tsx for the
// two buttons that call this same endpoint each way.
app.get("/api/crew-log", requireAuth, (req, res) => {
  res.json({
    entries: [
      { time: "06:00", note: "Bridge watch handover complete" },
      { time: "07:30", note: "Galley provisioning check — all decks stocked" },
      { time: "09:15", note: `Guest services: ${req.session.user} checked in at Cabin 1204` },
      { time: "12:00", note: "Lifeboat drill scheduled for 16:00" },
    ],
  });
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
  console.log(`  Session:      http://localhost:${PORT}/api/session`);
  console.log(`  Login:        POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  Crew log:     http://localhost:${PORT}/api/crew-log (requires session cookie)`);
});
