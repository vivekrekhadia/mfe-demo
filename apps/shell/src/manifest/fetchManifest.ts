import { isMfeManifest, type MfeManifest } from "@mfe/shared-types";
import { MANIFEST_PATH } from "@mfe/shared-config";

export type ManifestResult = { ok: true; manifest: MfeManifest } | { ok: false; error: string };

// MFE_MANIFEST_URL is replaced at build time (see the DefinePlugin call in
// rspack.config.mjs) from apps/shell/.env.local — never set in a production
// build, since ship:build never has that file. Lets a developer point the
// Shell at a local manifest.local.json (or another Ship Server entirely)
// without touching the production manifest path.
declare const MFE_MANIFEST_URL: string;

/**
 * Resolves which manifest URL to fetch. Defaults to the real Ship Server
 * path; a non-empty MFE_MANIFEST_URL build define overrides it for local
 * dev only.
 */
export function resolveManifestUrl(): string {
  return typeof MFE_MANIFEST_URL === "string" && MFE_MANIFEST_URL.length > 0
    ? MFE_MANIFEST_URL
    : MANIFEST_PATH;
}

/**
 * Pure fetch-and-validate logic, extracted out of the React hook so it can
 * be unit tested without a DOM: given any fetch-like function, resolves to
 * either a schema-valid manifest or a plain-English error describing why
 * it wasn't usable (HTTP failure, bad JSON, or a manifest missing an MFE).
 */
export async function fetchManifest(
  fetchImpl: typeof fetch = fetch,
  manifestUrl: string = resolveManifestUrl(),
): Promise<ManifestResult> {
  try {
    const response = await fetchImpl(`${manifestUrl}?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, error: `Manifest request failed with HTTP ${response.status}` };
    }
    const data: unknown = await response.json();
    if (!isMfeManifest(data)) {
      return { ok: false, error: "Manifest failed schema validation" };
    }
    return { ok: true, manifest: data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
