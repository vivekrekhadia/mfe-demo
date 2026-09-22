import { useShellState } from "@mfe/shared-state";
import { Badge, Icon } from "@mfe/design-system";

/**
 * Deliberately trivial: a real ship-local identity provider is a separate
 * architectural concern from MFE delivery (see README "Authentication").
 * This only proves the point that *some* session data can be served
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
    </div>
  );
}
