import { useShellState } from "@mfe/shared-state";
import { Icon } from "@mfe/design-system";

/**
 * One control, in the Shell header, that hides or shows every <HelperNote>
 * across the Shell and every independently-loaded MFE at once — reading
 * and writing the same @mfe/shared-state context the notification badge
 * uses (see SessionBadge.tsx), just to prove the point that state shared
 * this way isn't a one-off for that one feature.
 */
export function HelperNotesToggle() {
  const shellState = useShellState();
  if (!shellState) return null;

  return (
    <button
      className="helper-notes-toggle"
      onClick={shellState.toggleHelperNotes}
      title="Show or hide the implementation notes across the whole app"
    >
      <Icon name="info" size={13} />
      {shellState.showHelperNotes ? "Hide notes" : "Show notes"}
    </button>
  );
}
