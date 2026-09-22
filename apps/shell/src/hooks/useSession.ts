import { useEffect, useState } from "react";
import { fetchSession, type SessionResult } from "./fetchSession";

export type SessionState = { status: "loading" } | SessionResult;

/**
 * Extracted out of SessionBadge so the same fetched session can also feed
 * ShellStateProvider and the auth gate (see App.tsx) — one fetch, shared by
 * the Shell's own header and by every MFE that reads it via
 * useShellState().
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
