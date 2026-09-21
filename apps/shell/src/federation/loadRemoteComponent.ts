import type { ComponentType } from "react";

type RemoteModule = { default: ComponentType };
export type LoadResult =
  | { ok: true; Component: ComponentType }
  | { ok: false; error: string };

/**
 * Pure load-and-catch logic, extracted out of RemoteLoader so the
 * "an MFE failed to load" path is unit-testable without rendering React.
 */
export async function loadRemoteComponent(loader: () => Promise<RemoteModule>): Promise<LoadResult> {
  try {
    const mod = await loader();
    return { ok: true, Component: mod.default };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
