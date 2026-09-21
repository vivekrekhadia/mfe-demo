import { isMfeManifest, type MfeManifest } from "@mfe/shared-types";
import { MANIFEST_PATH } from "@mfe/shared-config";

export type ManifestResult = { ok: true; manifest: MfeManifest } | { ok: false; error: string };

/**
 * Pure fetch-and-validate logic, extracted out of the React hook so it can
 * be unit tested without a DOM: given any fetch-like function, resolves to
 * either a schema-valid manifest or a plain-English error describing why
 * it wasn't usable (HTTP failure, bad JSON, or a manifest missing an MFE).
 */
export async function fetchManifest(
  fetchImpl: typeof fetch = fetch,
): Promise<ManifestResult> {
  try {
    const response = await fetchImpl(`${MANIFEST_PATH}?ts=${Date.now()}`, { cache: "no-store" });
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
