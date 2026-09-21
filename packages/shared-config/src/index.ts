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

/** Mock local API used to demonstrate that auth/session is a local, offline concern. */
export const MOCK_SESSION_PATH = "/api/session";
