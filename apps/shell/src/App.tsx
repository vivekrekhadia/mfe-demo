import type { ComponentType, ReactNode } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ShellStateProvider } from "@mfe/shared-state";
import { Icon, type IconName } from "@mfe/design-system";
import { useShipManifest } from "./manifest/useShipManifest";
import { useSession } from "./hooks/useSession";
import type { SessionState } from "./hooks/useSession";
import { ReleaseInfo } from "./components/ReleaseInfo";
import { SessionBadge } from "./components/SessionBadge";
import { HelperNotesToggle } from "./components/HelperNotesToggle";
import { RouteOwnershipBanner } from "./components/RouteOwnershipBanner";
import { RemoteLoader } from "./federation/RemoteLoader";
import { importBookings, importDining, importPayment, importSignin } from "./federation/remoteImports";

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
//
// "/signin" is deliberately NOT in this list — it's not a business-domain
// MFE tab, it's the one route accessible while unauthenticated, and it
// renders outside AppShell's header/nav entirely (see AuthGate below).
const ROUTES: { path: string; label: string; icon: IconName; loader: () => Promise<{ default: ComponentType }> }[] = [
  { path: "/bookings/*", label: "Bookings", icon: "bed", loader: importBookings },
  { path: "/dining/*", label: "Dining", icon: "utensils", loader: importDining },
  { path: "/payments/*", label: "Payments", icon: "credit-card", loader: importPayment },
];

export function App() {
  const { state, reload } = useShipManifest();
  const sessionState = useSession();
  const session = sessionState.status === "authenticated" ? sessionState.session : null;

  return (
    <ShellStateProvider session={session}>
      <AuthGate manifestState={state} reload={reload} sessionState={sessionState} />
    </ShellStateProvider>
  );
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="mfe-slot mfe-slot-loading" aria-label={label}>
      <div className="mfe-skeleton-line" style={{ width: "40%" }} />
      <div className="mfe-skeleton-line" style={{ width: "90%" }} />
      <div className="mfe-skeleton-line" style={{ width: "75%" }} />
    </div>
  );
}

/**
 * Shown only while the very first session check is in flight — i.e. we
 * don't yet know whether the visitor is authenticated. Deliberately
 * neutral (no "Sign in" branding, no app chrome): this same moment
 * happens on every single page load/refresh, including an already-signed-in
 * user reopening a route they were just on, so showing the *unauthenticated*
 * sign-in layout here (as this used to) meant every reload flashed the
 * wrong screen — bare two-panel branding where the real app was about to
 * render — before flipping over once the session check resolved. A plain,
 * non-committal loader avoids asserting either state.
 */
function FullPageLoader() {
  return (
    <div className="shell-boot-loader" role="status" aria-label="Loading">
      <span className="shell-boot-loader-mark">
        <Icon name="anchor" size={22} />
      </span>
    </div>
  );
}

/**
 * The two-panel frame around every unauthenticated screen: a branded
 * panel (hidden on narrow viewports — see the media query in styles.css)
 * and a form panel that centers whatever's passed as children. Shared by
 * both AuthGate states that render before a session is known (see below)
 * so the brand panel doesn't flash in and out between them.
 */
function SigninLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell-signin-layout">
      <div className="shell-signin-brand">
        <div className="shell-signin-brand-inner">
          <span className="shell-signin-brand-mark">
            <Icon name="anchor" size={24} />
          </span>
          <h1 className="shell-signin-brand-title">Cruise Ship Portal</h1>
          <p className="shell-signin-brand-tagline">
            Ship-side access to Bookings, Dining and Payments — served entirely from this ship's
            own local server, no cloud account or internet connection required.
          </p>
        </div>
      </div>
      <div className="shell-signin-form-panel">{children}</div>
    </div>
  );
}

/**
 * Owns the one decision the Shell makes about authentication: whether to
 * show the sign-in MFE or the authenticated app. Per the book pattern this
 * project follows — the sign-in MFE owns the form/validation/session
 * creation, the Shell only checks session validity on load and redirects
 * (see apps/signin-mfe/src/SignInApp.tsx and README "Authentication").
 *
 * Authenticated users always render <AppShell>, letting it keep handling
 * manifest loading/error/retry exactly as it already did — nothing here
 * changes that path. Unauthenticated users hit a bare layout (no header,
 * no nav, no SessionBadge — those all imply access to routes that aren't
 * actually reachable yet) that itself waits on the manifest before trying
 * to load the sign-in remote, since /signin is a real Module Federation
 * remote resolved from the same runtime manifest as every other MFE (see
 * dynamicRemote() in rspack.config.mjs) — redirecting there before the
 * manifest has loaded would just make RemoteLoader fail immediately.
 */
interface AuthGateProps {
  manifestState: ReturnType<typeof useShipManifest>["state"];
  reload: ReturnType<typeof useShipManifest>["reload"];
  sessionState: SessionState;
}

function AuthGate({ manifestState, reload, sessionState }: AuthGateProps) {
  const location = useLocation();
  const isSigninRoute = location.pathname === "/signin";

  if (sessionState.status === "loading") {
    return <FullPageLoader />;
  }

  if (sessionState.status === "authenticated") {
    if (isSigninRoute) {
      const redirect = new URLSearchParams(location.search).get("redirect");
      return <Navigate to={redirect && redirect.startsWith("/") ? redirect : "/"} replace />;
    }
    return <AppShell state={manifestState} reload={reload} />;
  }

  // sessionState.status === "unauthenticated"
  if (!isSigninRoute) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return (
    <SigninLayout>
      <RouteOwnershipBanner />
      {manifestState.status === "loading" && <LoadingSkeleton label="Loading ship configuration" />}
      {manifestState.status === "error" && (
        <div className="mfe-slot mfe-slot-error">
          <p className="mfe-slot-error-title">
            <Icon name="bell" size={16} />
            Unable to reach the Ship Server.
          </p>
          <p className="mfe-slot-error-detail">{manifestState.message}</p>
          <button className="ds-button ds-button-primary" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      )}
      {manifestState.status === "ready" && <RemoteLoader label="Sign In" loader={importSignin} />}
    </SigninLayout>
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
        {state.status === "loading" && <LoadingSkeleton label="Loading ship configuration" />}

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
