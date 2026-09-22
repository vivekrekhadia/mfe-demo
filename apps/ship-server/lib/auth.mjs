import crypto from "node:crypto";

// Deliberately no credential check and no user store: this is a demo/POC
// (see README "Authentication"), so any non-empty username/password is
// accepted, and the username entered is exactly what shows up as the
// signed-in user everywhere in the UI (SessionBadge, "Signed in as ..." in
// each MFE) — nothing is hashed, stored, or verified against anything.
//
// What stays real: the session issued below. It's still an opaque,
// server-generated token, held only server-side in this Map, required (as
// an httpOnly cookie) on every subsequent request — see requireAuth() in
// server.mjs and the crew-log demo (CrewLogDemo.tsx) for that being
// genuinely enforced, not just decorative. Removing the credential check
// doesn't touch any of that: a request with no valid token still gets a
// real 401 from both /api/session and /api/crew-log.

const MAX_LEN = 200;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h

/**
 * Accepts any username/password as long as both are non-empty strings —
 * returns the trimmed username to use as the display name, or null if the
 * input isn't even usable as one (missing, empty, or absurdly long).
 */
export function authenticate(username, password) {
  if (typeof username !== "string" || typeof password !== "string") return null;
  const trimmed = username.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LEN) return null;
  if (password.length === 0 || password.length > MAX_LEN) return null;
  return trimmed;
}

const sessions = new Map();

export function createSession(displayName) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { user: displayName, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const record = sessions.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return record;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}
