import { useShellState } from "@mfe/shared-state";
import { Badge, Icon } from "@mfe/design-system";
import { AUTH_LOGOUT_PATH } from "@mfe/shared-config";

/**
 * Shows the real ship-local session (see README "Authentication" for what
 * "real" does and doesn't mean here — no cloud identity provider, an
 * in-memory session store on the Ship Server). Session data is served
 * entirely from the Ship Server, with no cloud round-trip, so the Shell
 * never blocks on connectivity it doesn't have.
 *
 * Reads via useShellState() rather than fetching itself: the Shell's own
 * header and every MFE now read the exact same ShellStateProvider value
 * (see App.tsx and @mfe/shared-state), so this component also doubles as
 * proof that writes an MFE makes (see Bookings' "Notify crew" button) are
 * visible back here, in the Shell, without a page reload.
 */
export function SessionBadge() {
  const shellState = useShellState();

  if (!shellState?.session) return null;

  const { session, notificationCount } = shellState;

  async function signOut() {
    await fetch(AUTH_LOGOUT_PATH, { method: "POST", credentials: "include" });
    // Full reload rather than SPA navigation: AuthGate's session check runs
    // on load (see apps/shell/src/App.tsx) — a reload is the simplest way
    // to make it re-run and land the user back on /signin.
    window.location.reload();
  }

  return (
    <div className="sh:flex sh:items-center sh:gap-2">
      {notificationCount > 0 && (
        <Badge tone="accent" title={shellState.lastNotification ?? undefined}>
          <Icon name="bell" size={13} />
          {notificationCount} notification{notificationCount === 1 ? "" : "s"}
        </Badge>
      )}
      <Badge title={`Authenticated via ${session.authenticatedVia}`}>
        <Icon name="user" size={13} />
        {session.user}
      </Badge>
      <button className="sh:text-xs sh:text-white/80 sh:underline sh:bg-transparent sh:border-0 sh:cursor-pointer" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
