import { Component, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

export interface RouteErrorBoundaryProps {
  /**
   * Stable identity for this boundary's slot — must be unique among
   * whatever this app can ever render at the same tree position (e.g.
   * Menu and Reviews share an <Outlet> position in DiningApp.tsx, so they
   * need different ids), and must also be passed as this element's React
   * `key` at the call site (see DiningApp.tsx) so switching between
   * different slots properly unmounts/remounts instead of one instance
   * getting reused across routes it was never meant to represent — the
   * same bug, and the same fix, as the Shell's own per-tab RemoteLoader
   * keying.
   *
   * Namespaced per MFE on purpose (e.g. "dining:menu", not just "menu"):
   * this component is a Module Federation singleton shared by every MFE
   * plus the Shell, so two MFEs both using a plain "index" id would
   * otherwise collide in the one shared sticky-error store below.
   */
  id: string;
  /** What this boundary protects — shown in the fallback so it's clear WHERE something broke (e.g. "Menu", "Reviews", "Dining home"), not just that "something" did. */
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Deliberately NOT component state alone. A crash here is meant to stay
// visibly broken even after navigating away and back — silently healing
// itself just because the user looked away would read as the app hiding a
// real problem; "Retry" is the one explicit, human decision that's
// supposed to clear it. But navigating away can genuinely unmount this
// boundary (see the `id`/`key` note above), and unmounted React state is
// gone for good — so "still broken" has to live somewhere that survives
// the unmount. This in-memory, page-load-scoped Map is that somewhere.
// It intentionally does NOT survive a full page reload: refreshing the
// page is a stronger, deliberate reset signal, not an accident.
const stickyErrors = new Map<string, Error>();

/**
 * A route-scoped error boundary any MFE wraps around one <Route>'s own
 * element (see apps/dining-mfe/src/DiningApp.tsx for every nesting level
 * doing this, including child routes like Menu/Reviews) — so a crash in
 * one screen shows an error only in its own slot, not its parent layout's
 * chrome, sibling routes, or (via the Shell's own RemoteErrorBoundary) the
 * whole remote. Shows both WHERE (the label) and WHY (the actual caught
 * error's message) it broke, not a generic "unavailable" string — and
 * stays showing that error across navigation, until "Retry" is pressed
 * (see the sticky-store comment above for why that needs external state,
 * not just this.state).
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
  state: State = { error: stickyErrors.get(this.props.id) ?? null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    stickyErrors.set(this.props.id, error);
    console.error(`[${this.props.label}] crashed while rendering:`, error);
  }

  private reset = () => {
    stickyErrors.delete(this.props.id);
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="ds-route-error">
          <p className="ds-route-error-title">
            <Icon name="bell" size={16} />
            Something went wrong in {this.props.label}.
          </p>
          <p className="ds-route-error-detail">{error.message}</p>
          <Button onClick={this.reset}>Retry</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
