import { useCallback, useEffect, useState } from "react";
import type { MfeManifest } from "@mfe/shared-types";
import { fetchManifest } from "./fetchManifest";

export type ManifestState =
  | { status: "loading" }
  | { status: "ready"; manifest: MfeManifest }
  | { status: "error"; message: string };

/** Thin React wrapper around fetchManifest(): owns state, sets the global the federation runtime reads. */
export function useShipManifest() {
  const [state, setState] = useState<ManifestState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchManifest();
    if (result.ok) {
      window.__SHIP_MANIFEST__ = result.manifest;
      setState({ status: "ready", manifest: result.manifest });
    } else {
      setState({ status: "error", message: result.error });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
