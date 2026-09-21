import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, "..", "..");

/** Shore-side staging area: what CI/CD would produce before transfer to the ship. */
export const STAGING_DIR = path.join(ROOT, "releases");

export const SHIP_SERVER_DIR = path.join(ROOT, "apps", "ship-server");
export const SHIP_PUBLIC_DIR = path.join(SHIP_SERVER_DIR, "public");

/** Immutable, installed releases — never overwritten once written. */
export const SHIP_RELEASES_DIR = path.join(SHIP_PUBLIC_DIR, "mfe", "releases");

/** The Shell's static build, served at the Ship Server's root. */
export const SHIP_SHELL_DIR = path.join(SHIP_PUBLIC_DIR, "shell");

/** The mutable, atomically-swapped, runtime-fetched manifest. */
export const ACTIVE_MANIFEST_PATH = path.join(SHIP_PUBLIC_DIR, "config", "mfe-manifest.json");

/** Small local state describing the activation history (for rollback). */
export const STATE_DIR = path.join(SHIP_SERVER_DIR, "state");
export const HISTORY_PATH = path.join(STATE_DIR, "history.json");

export const APPS = {
  shell: path.join(ROOT, "apps", "shell"),
  bookings: path.join(ROOT, "apps", "bookings-mfe"),
  dining: path.join(ROOT, "apps", "dining-mfe"),
  payment: path.join(ROOT, "apps", "payment-mfe"),
};

export const MFE_NAMES = ["bookings", "dining", "payment"];
