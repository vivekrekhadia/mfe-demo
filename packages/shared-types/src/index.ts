/**
 * Shared types describing the runtime MFE manifest contract between the
 * Ship Server (producer), the release-management scripts (writer) and the
 * Shell application (consumer). This is the ONE contract that lets all
 * three evolve independently.
 */

export const MFE_NAMES = ["bookings", "dining", "payment"] as const;

export type MfeName = (typeof MFE_NAMES)[number];

/** A single MFE's entry inside the active runtime manifest. */
export interface MfeManifestEntry {
  /** Semver of the individual MFE build, independent of the ship release. */
  version: string;
  /** Absolute path (on the Ship Server) to the MFE's Module Federation entry point. */
  url: string;
}

/**
 * The runtime manifest served by the Ship Server at /config/mfe-manifest.json.
 * The Shell fetches this at startup and uses it as the ONLY source of truth
 * for where to load each MFE's remoteEntry.js from. Nothing about MFE
 * locations is hard-coded in the Shell's source or build.
 */
export interface MfeManifest {
  /** The ship release identifier this manifest was generated from, e.g. "2026.09.10". */
  release: string;
  /** ISO timestamp of when this manifest was written to the active config slot. */
  activatedAt: string;
  mfes: Record<MfeName, MfeManifestEntry>;
}

export function isMfeManifest(value: unknown): value is MfeManifest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.release !== "string" || v.release.length === 0) return false;
  if (typeof v.activatedAt !== "string") return false;
  if (typeof v.mfes !== "object" || v.mfes === null) return false;
  const mfes = v.mfes as Record<string, unknown>;
  for (const name of MFE_NAMES) {
    const entry = mfes[name] as Record<string, unknown> | undefined;
    if (!entry || typeof entry !== "object") return false;
    if (typeof entry.version !== "string" || entry.version.length === 0) return false;
    if (typeof entry.url !== "string" || entry.url.length === 0) return false;
  }
  return true;
}
