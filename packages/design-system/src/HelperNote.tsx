import type { ReactNode } from "react";
import { useShellState } from "@mfe/shared-state";
import { Icon } from "./Icon";

export interface HelperNoteProps {
  children: ReactNode;
}

/**
 * A small, visually distinct callout used ONLY to narrate the running
 * architecture for whoever's watching the demo — e.g. "this screen loaded
 * via Module Federation from the bookings remote" — never real product
 * copy. Deliberately styled to look like a developer's margin note (dashed
 * border, accent color, small type), not part of the actual UI.
 *
 * Reads the Shell's showHelperNotes toggle (see @mfe/shared-state and
 * apps/shell/src/components/HelperNotesToggle.tsx) so a presenter can hide
 * every one of these across the Shell and every independently-loaded MFE
 * with one click — itself a live demonstration of the same cross-app
 * shared state this repo already uses for the notification count.
 *
 * Renders unconditionally when there's no Shell above the caller at all
 * (e.g. an MFE's own standalone dev mode) — there's no toggle to read
 * there anyway, and seeing the annotation is exactly the point while
 * developing that MFE in isolation.
 */
export function HelperNote({ children }: HelperNoteProps) {
  const shellState = useShellState();
  if (shellState && !shellState.showHelperNotes) return null;

  return (
    <div className="ds-helper-note">
      <Icon name="info" size={14} />
      <span>{children}</span>
    </div>
  );
}
