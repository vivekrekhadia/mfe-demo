import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Icon } from "@mfe/design-system";
import { RemoteErrorBoundary } from "./RemoteErrorBoundary";
import { loadRemoteComponent } from "./loadRemoteComponent";

type RemoteModule = { default: ComponentType };

type LoadState =
  | { status: "loading" }
  | { status: "ready"; Component: ComponentType }
  | { status: "error"; message: string };

interface RemoteLoaderProps {
  label: string;
  loader: () => Promise<RemoteModule>;
}

/**
 * Loads one remote MFE module through Module Federation and renders it.
 * Handles the three states the manifest-driven, network-dependent load can
 * be in: loading, ready, or failed-to-load (e.g. the Ship Server is down,
 * or the manifest points at a release that was never deployed).
 */
export function RemoteLoader({ label, loader }: RemoteLoaderProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await loadRemoteComponent(loader);
    if (result.ok) {
      setState({ status: "ready", Component: result.Component });
    } else {
      setState({ status: "error", message: result.error });
    }
  }, [loader]);

  useEffect(() => {
    void load();
    // `attempt` is intentionally a dependency: bumping it via Retry re-runs the load.
  }, [load, attempt]);

  if (state.status === "loading") {
    return (
      <div className="mfe-slot mfe-slot-loading" aria-label={`Loading ${label}`}>
        <div className="mfe-skeleton-line" style={{ width: "35%" }} />
        <div className="mfe-skeleton-line" style={{ width: "85%" }} />
        <div className="mfe-skeleton-line" style={{ width: "70%" }} />
        <div className="mfe-skeleton-line" style={{ width: "50%" }} />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mfe-slot mfe-slot-error">
        <p className="mfe-slot-error-title">
          <Icon name="bell" size={16} />
          Unable to load {label}.
        </p>
        <p className="mfe-slot-error-detail">The {label} service is currently unavailable.</p>
        <button className="ds-button ds-button-primary" onClick={() => setAttempt((a) => a + 1)}>
          Retry
        </button>
      </div>
    );
  }

  const { Component } = state;
  return (
    <RemoteErrorBoundary label={label}>
      <div className="mfe-slot">
        <Component />
      </div>
    </RemoteErrorBoundary>
  );
}
