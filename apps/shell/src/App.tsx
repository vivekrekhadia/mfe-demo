import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useShipManifest } from "./manifest/useShipManifest";
import { ReleaseInfo } from "./components/ReleaseInfo";
import { SessionBadge } from "./components/SessionBadge";
import { RemoteLoader } from "./federation/RemoteLoader";
import { importBookings, importDining, importPayment } from "./federation/remoteImports";

// Route-based MFEs: the URL is the single source of truth for which remote
// is mounted (an agreed MFE standard — see README "MFE standards
// alignment"). Each MFE owns one top-level path; the Shell only routes,
// it never inspects or depends on what's inside an MFE's own screen.
const ROUTES = [
  { path: "/bookings", label: "Bookings", loader: importBookings },
  { path: "/dining", label: "Dining", loader: importDining },
  { path: "/payments", label: "Payments", loader: importPayment },
];

export function App() {
  const { state, reload } = useShipManifest();

  return (
    <div className="shell-app">
      <header className="shell-header">
        <h1>Cruise Ship Portal</h1>
        <SessionBadge />
      </header>

      <nav className="shell-nav">
        {ROUTES.map((r) => (
          <NavLink
            key={r.path}
            to={r.path}
            className={({ isActive }) => (isActive ? "nav-tab nav-tab-active" : "nav-tab")}
          >
            {r.label}
          </NavLink>
        ))}
      </nav>

      {state.status === "ready" && <ReleaseInfo manifest={state.manifest} />}

      <main className="shell-main">
        {state.status === "loading" && (
          <div className="mfe-slot mfe-slot-loading">Loading ship configuration...</div>
        )}

        {state.status === "error" && (
          <div className="mfe-slot mfe-slot-error">
            <p className="mfe-slot-error-title">Unable to reach the Ship Server.</p>
            <p className="mfe-slot-error-detail">{state.message}</p>
            <button onClick={() => void reload()}>Retry</button>
          </div>
        )}

        {state.status === "ready" && (
          <Routes>
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<RemoteLoader label={r.label} loader={r.loader} />} />
            ))}
            <Route path="*" element={<Navigate to="/bookings" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
