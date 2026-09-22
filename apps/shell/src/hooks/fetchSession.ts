import { MOCK_SESSION_PATH } from "@mfe/shared-config";
import type { ShellSession } from "@mfe/shared-state";

export type SessionResult =
  | { status: "authenticated"; session: ShellSession }
  | { status: "unauthenticated" };

/**
 * Pure fetch-and-interpret logic, extracted out of useSession so the
 * "no/expired session" path is unit-testable without rendering React —
 * mirrors the fetchManifest()/useShipManifest() split in
 * ../manifest/fetchManifest.ts.
 *
 * credentials: "include" is required here: the session lives in an
 * httpOnly cookie set by POST /api/auth/login (see
 * apps/ship-server/server.mjs), and fetch() does not send cookies on a
 * cross-origin-looking request (which this is, during `pnpm --filter
 * @mfe/shell dev` on :5000) without it. Any non-2xx response (a real 401,
 * or the Ship Server being unreachable entirely) is treated the same way:
 * "no session" — the Shell only ever needs a binary authenticated/not
 * signal, never a reason.
 */
export async function fetchSession(
  fetchImpl: typeof fetch = fetch,
  sessionUrl: string = MOCK_SESSION_PATH,
): Promise<SessionResult> {
  try {
    const response = await fetchImpl(sessionUrl, { credentials: "include", cache: "no-store" });
    if (!response.ok) {
      return { status: "unauthenticated" };
    }
    const session: ShellSession = await response.json();
    return { status: "authenticated", session };
  } catch {
    return { status: "unauthenticated" };
  }
}
