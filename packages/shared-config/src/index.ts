/**
 * Configuration shared across the Shell and the ship-side scripts.
 * These are structural constants (paths, ports) — not environment
 * secrets and not remote URLs. Remote URLs always come from the
 * runtime manifest, never from here.
 */

/** Path the Shell fetches at runtime to discover active MFE locations. */
export const MANIFEST_PATH = "/config/mfe-manifest.json";

/** Default port the Ship Server listens on. */
export const SHIP_SERVER_PORT = 4173;

/**
 * Local session-check API: proves session state can be served entirely by
 * the Ship Server, no cloud round-trip. Returns 200 + the session while a
 * valid `ship_session` cookie is present, 401 otherwise — see
 * apps/ship-server/server.mjs and README "Authentication".
 */
export const MOCK_SESSION_PATH = "/api/session";

/** Ship-local login: verifies credentials against the local user store and issues the session cookie. */
export const AUTH_LOGIN_PATH = "/api/auth/login";

/** Ship-local logout: clears the session cookie and its server-side session record. */
export const AUTH_LOGOUT_PATH = "/api/auth/logout";

/**
 * Demo-only protected endpoint (requires the ship_session cookie) used to
 * show that an MFE's own fetch calls carry the session automatically —
 * see BookingsList.tsx's two "crew log" buttons and README "Authentication".
 */
export const CREW_LOG_PATH = "/api/crew-log";
