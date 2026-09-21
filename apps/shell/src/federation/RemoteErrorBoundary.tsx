import { Component, type ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time exceptions thrown by an already-loaded remote
 * component. This is distinct from — and in addition to — the load-time
 * failure handling in RemoteLoader, which covers the case where the
 * remote's remoteEntry.js never loads in the first place. Together they
 * guarantee one misbehaving MFE cannot take down the Shell or its siblings.
 */
export class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[shell] ${this.props.label} crashed while rendering:`, error);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="mfe-slot mfe-slot-error">
          <p className="mfe-slot-error-title">Unable to load {this.props.label}.</p>
          <p className="mfe-slot-error-detail">
            The {this.props.label} service is currently unavailable.
          </p>
          <button onClick={this.reset}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
