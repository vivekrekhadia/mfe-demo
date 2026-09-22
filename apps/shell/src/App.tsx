import type { ComponentType } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ShellStateProvider } from "@mfe/shared-state";
import { Icon, type IconName } from "@mfe/design-system";
import { useShipManifest } from "./manifest/useShipManifest";
import { useSession } from "./hooks/useSession";
import { ReleaseInfo } from "./components/ReleaseInfo";
import { SessionBadge } from "./components/SessionBadge";
import { HelperNotesToggle } from "./components/HelperNotesToggle";
import { RouteOwnershipBanner } from "./components/RouteOwnershipBanner";
import { RemoteLoader } from "./federation/RemoteLoader";
import { importBookings, importDining, importPayment } from "./federation/remoteImports";

// Route-based MFEs: the URL is the single source of truth for which remote
// is mounted (an agreed MFE standard — see README "MFE standards
// alignment"). Each MFE owns one top-level path; the Shell only routes,
// it never inspects or depends on what's inside an MFE's own screen.
//
// "/bookings/*" (not "/bookings") lets Bookings own its own sub-routes
// (e.g. /bookings/:cabin/guests/:guestId, several levels deep) via its own
// nested <Routes> — the Shell still only knows about the one top-level
// path, it never has to enumerate an MFE's internal screens. All three
// MFEs use this same "/*" pattern for the same reason.
const ROUTES: { path: string; label: string; icon: IconName; loader: () => Promise<{ default: ComponentType }> }[] = [
  { path: "/bookings/*", label: "Bookings", icon: "bed", loader: importBookings },
  { path: "/dining/*", label: "Dining", icon: "utensils", loader: importDining },
  { path: "/payments/*", label: "Payments", icon: "credit-card", loader: importPayment },
];

export function App() {
  const { state, reload } = useShipManifest();
  const session = useSession();

  return (
    <ShellStateProvider session={session}>
      <AppShell state={state} reload={reload} />
    </ShellStateProvider>
  );
}

function AppShell({ state, reload }: Pick<ReturnType<typeof useShipManifest>, "state" | "reload">) {
  return (
    <div className="shell-app">
      <header className="shell-header">
        <div className="shell-brand">
          <span className="shell-brand-mark">
            <Icon name="anchor" size={19} />
          </span>
          <div className="sh:flex sh:items-center sh:gap-2">
            <h1>Cruise Ship Portal</h1>
            <span className="sh:hidden sh:sm:inline-flex sh:items-center sh:gap-1.5 sh:rounded-ds-pill sh:bg-ds-navy-light sh:px-3 sh:py-1 sh:text-xs sh:text-white">
              <span className="sh:h-1.5 sh:w-1.5 sh:rounded-full sh:bg-ds-accent sh:animate-pulse" />
              Ship-side · offline ready
            </span>
          </div>
        </div>
        <div className="sh:flex sh:items-center sh:gap-2">
          <HelperNotesToggle />
          <SessionBadge />
        </div>
      </header>

      <nav className="shell-nav">
        {ROUTES.map((r) => (
          <NavLink
            key={r.path}
            // Strip the trailing "/*" (a Route-matching pattern, not a
            // navigable URL) so the tab always links to the MFE's base
            // path; NavLink's default non-"end" matching still marks it
            // active for any of that MFE's sub-routes too.
            to={r.path.replace(/\/\*$/, "")}
            className={({ isActive }) => (isActive ? "nav-tab nav-tab-active" : "nav-tab")}
          >
            <Icon name={r.icon} size={15} />
            {r.label}
          </NavLink>
        ))}
      </nav>

      {state.status === "ready" && <ReleaseInfo manifest={state.manifest} />}

      <main className="shell-main">
        {state.status === "loading" && (
          <div className="mfe-slot mfe-slot-loading" aria-label="Loading ship configuration">
            <div className="mfe-skeleton-line" style={{ width: "40%" }} />
            <div className="mfe-skeleton-line" style={{ width: "90%" }} />
            <div className="mfe-skeleton-line" style={{ width: "75%" }} />
          </div>
        )}

        {state.status === "error" && (
          <div className="mfe-slot mfe-slot-error">
            <p className="mfe-slot-error-title">
              <Icon name="bell" size={16} />
              Unable to reach the Ship Server.
            </p>
            <p className="mfe-slot-error-detail">{state.message}</p>
            <button className="ds-button ds-button-primary" onClick={() => void reload()}>
              Retry
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <RouteOwnershipBanner />
            <Routes>
              {ROUTES.map((r) => (
                <Route key={r.path} path={r.path} element={<RemoteLoader label={r.label} loader={r.loader} />} />
              ))}
              <Route path="*" element={<Navigate to="/bookings" replace />} />
            </Routes>
          </>
        )}
      </main>
    </div>
  );
}
