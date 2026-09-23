import { Component, type ReactNode } from "react";
import { Icon } from "@mfe/design-system";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Deliberately NOT component state alone — same reasoning as
// @mfe/design-system's RouteErrorBoundary (see its own comment): a crash
// here is meant to stay visible after navigating to another tab and back,
// not quietly heal itself, so "still broken" has to survive this
// component's own unmount (RemoteLoader's per-tab `key` — see
// apps/shell/src/App.tsx — means switching tabs really does unmount this).
// A separate Map from RouteErrorBoundary's own, deliberately: this one is
// Shell-only code, never shared with MFE content, so there's no risk of
// an MFE's route id colliding with a tab label here.
const stickyErrors = new Map<string, Error>();

/**
 * Catches render-time exceptions thrown by an already-loaded remote
 * component. This is distinct from — and in addition to — the load-time
 * failure handling in RemoteLoader, which covers the case where the
 * remote's remoteEntry.js never loads in the first place. Together they
 * guarantee one misbehaving MFE cannot take down the Shell or its siblings.
 *
 * A genuinely separate concern from — and a coarser last line of defense
 * behind — each MFE's own per-route boundaries (see
 * @mfe/design-system's RouteErrorBoundary, used throughout
 * apps/dining-mfe/src/DiningApp.tsx): those catch a crash in one specific
 * screen without disturbing its own layout/siblings. This one only ever
 * fires for something an MFE's per-route boundaries didn't catch — a bug
 * in the MFE's own top-level exported component, before any inner
 * boundary exists to catch it.
 */
export class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { error: stickyErrors.get(this.props.label) ?? null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    stickyErrors.set(this.props.label, error);
    console.error(`[shell] ${this.props.label} crashed while rendering:`, error);
  }

  private reset = () => {
    stickyErrors.delete(this.props.label);
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="mfe-slot mfe-slot-error">
          <p className="mfe-slot-error-title">
            <Icon name="bell" size={16} />
            Unable to load {this.props.label}.
          </p>
          <p className="mfe-slot-error-detail">{error.message}</p>
          <button className="ds-button ds-button-primary" onClick={this.reset}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
