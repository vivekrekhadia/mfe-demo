import { useEffect, useState } from "react";
import { MOCK_SESSION_PATH } from "@mfe/shared-config";
import type { ShellSession } from "@mfe/shared-state";

/**
 * Extracted out of SessionBadge so the same fetched session can also feed
 * ShellStateProvider (see App.tsx) — one fetch, shared by the Shell's own
 * header and by every MFE that reads it via useShellState().
 */
export function useSession(): ShellSession | null {
  const [session, setSession] = useState<ShellSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(MOCK_SESSION_PATH)
      .then((res) => res.json())
      .then((data: ShellSession) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}
