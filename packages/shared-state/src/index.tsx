import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/**
 * Cross-app shared state: the Shell owns this context and every MFE reads
 * (and can write to) the exact same value — proving state can flow both
 * Shell -> MFE and MFE -> Shell, not just via props at mount time.
 *
 * This ONLY works because `@mfe/shared-state` is registered as a
 * `singleton` in every app's Module Federation `shared` config (see
 * rspack.config.mjs in the Shell and each MFE). Without that, each
 * independently-built bundle would run its own copy of `createContext()`,
 * producing a different context identity per app, and `useContext` inside
 * an MFE would silently see the default value instead of the Shell's.
 */

export interface ShellSession {
  user: string;
  authenticatedVia: string;
}

export interface ShellStateValue {
  /** The same session the Shell fetches once and shows in its header (see SessionBadge). */
  session: ShellSession | null;
  /** Deliberately trivial mutable state, bumped from inside an MFE, to prove writes flow back up to the Shell. */
  notificationCount: number;
  lastNotification: string | null;
  notify: (message: string) => void;
  /**
   * Toggled from one control in the Shell's header (see HelperNotesToggle)
   * and read by every <HelperNote> in the Shell and every MFE — one flip
   * hides or shows the architecture call-outs everywhere at once, itself a
   * live demo of the same cross-app state this context exists to prove.
   */
  showHelperNotes: boolean;
  toggleHelperNotes: () => void;
}

const ShellStateContext = createContext<ShellStateValue | null>(null);

interface ShellStateProviderProps {
  session: ShellSession | null;
  children: ReactNode;
}

/** Mounted once, by the Shell, above the routed MFE slots. */
export function ShellStateProvider({ session, children }: ShellStateProviderProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  // Defaults to visible: the point of these notes is walking a first-time
  // viewer through the architecture, so they should be on by default, with
  // an easy way to hide them once everyone's seen enough.
  const [showHelperNotes, setShowHelperNotes] = useState(true);

  const notify = useCallback((message: string) => {
    setNotificationCount((count) => count + 1);
    setLastNotification(message);
  }, []);

  const toggleHelperNotes = useCallback(() => {
    setShowHelperNotes((shown) => !shown);
  }, []);

  return (
    <ShellStateContext.Provider
      value={{ session, notificationCount, lastNotification, notify, showHelperNotes, toggleHelperNotes }}
    >
      {children}
    </ShellStateContext.Provider>
  );
}

/**
 * Returns null when there is no Shell above the caller — e.g. an MFE's own
 * standalone dev mode (bootstrap.tsx), which never mounts ShellStateProvider.
 * Consumers must treat that as "no Shell state available", not an error.
 */
export function useShellState(): ShellStateValue | null {
  return useContext(ShellStateContext);
}
