import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, HelperNote, Icon } from "@mfe/design-system";
import { AUTH_LOGIN_PATH } from "@mfe/shared-config";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx — same reasoning as apps/payment-mfe/src/PaymentApp.tsx:
// bootstrap.tsx is only this MFE's standalone dev entry, never part of
// what the Shell actually loads at runtime. Preflight/theme is NOT
// imported here — the Shell owns that one global copy.
import "./tailwind.css";

type Status = "idle" | "submitting" | "error";

// Shared by both fields — kept as one string so a focus-ring/border-color
// tweak only ever needs to happen in one place.
const INPUT_CLASS =
  "si:w-full si:rounded-md si:border si:border-ds-border si:bg-white si:px-4 si:py-3 si:text-sm " +
  "si:text-ds-text si:shadow-sm si:outline-none si:transition-colors si:duration-150 " +
  "si:placeholder:text-ds-text-muted si:focus:border-ds-accent si:focus:ring-2 si:focus:ring-ds-accent/20";

/**
 * Owns the sign-in UI, form validation, and session creation — the Shell
 * only decides *when* to mount this (unauthenticated + on-load, see
 * apps/shell/src/App.tsx) and never touches a credential itself.
 *
 * On success this does a full page navigation rather than an in-SPA
 * `navigate()`: the session cookie set by /api/auth/login is httpOnly, so
 * there's no value this component could hand back to the Shell in memory
 * anyway, and RemoteLoader doesn't pass callback props into mounted
 * remotes today. A full reload is a clean, simple boundary crossing from
 * unauthenticated to authenticated, and matches "the Shell checks token
 * validity on load" rather than needing a live cross-MFE callback wired up
 * just for this one transition.
 */
// Prefilled, not just a placeholder: since any credentials are accepted
// (see lib/auth.mjs on the Ship Server), there's nothing to "get right" —
// prefilling lets a visitor hit Sign in immediately, while still being a
// normal editable field for anyone who wants to type their own name.
const DEFAULT_USERNAME = "demo";
const DEFAULT_PASSWORD = "demo@123";

export function SignInApp() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = searchParams.get("redirect") || "/";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch(AUTH_LOGIN_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setStatus("error");
        setError(body?.error ?? "Sign-in failed.");
        return;
      }

      window.location.assign(redirectTarget);
    } catch {
      setStatus("error");
      setError("Could not reach the Ship Server. Check your connection and try again.");
    }
  }

  return (
    // max-w-md (not max-w-sm) matters here: the parent .shell-signin-form-panel
    // (apps/shell/src/styles.css) is a column flexbox with align-items: center,
    // which overrides flex's default `stretch` — so RemoteLoader's .mfe-slot
    // wrapper around this component shrinks to fit whatever width we declare
    // here rather than filling the available panel. max-w-sm (384px) read as
    // a thin sliver in a panel that's often 800px+ wide; max-w-md gives the
    // card real presence without going wide enough to look sparse for just
    // two fields and a button.
    <div className="si:mx-auto si:w-full si:max-w-md">
      <div className="si:mb-8 si:flex si:flex-col si:items-center si:gap-3 si:text-center">
        <span className="si:flex si:h-14 si:w-14 si:items-center si:justify-center si:rounded-full si:bg-ds-navy si:text-white si:shadow-md">
          <Icon name="anchor" size={26} />
        </span>
        <div>
          <h1 className="si:text-2xl si:font-semibold si:text-ds-text">Welcome back</h1>
          <p className="si:mt-1.5 si:text-sm si:text-ds-text-muted">Sign in to the Cruise Ship Portal</p>
        </div>
      </div>

      <HelperNote>
        Demo mode: any username and password signs you in. The fields below are pre-filled — feel
        free to change them. The session token issued afterward is real; see the "Crew log" demo
        on the Bookings tab.
      </HelperNote>

      <form onSubmit={(e) => void handleSubmit(e)} className="si:mt-5 si:flex si:flex-col si:gap-5">
        <label className="si:flex si:flex-col si:gap-1.5 si:text-left">
          <span className="si:text-sm si:font-medium si:text-ds-text">Username</span>
          <input
            className={INPUT_CLASS}
            type="text"
            name="username"
            autoComplete="username"
            placeholder="e.g. jsmith"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label className="si:flex si:flex-col si:gap-1.5 si:text-left">
          <span className="si:text-sm si:font-medium si:text-ds-text">Password</span>
          <input
            className={INPUT_CLASS}
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <div
            className="si:flex si:items-start si:gap-2 si:rounded-md si:border si:border-ds-danger/25 si:bg-ds-danger-bg si:px-3 si:py-2.5 si:text-sm si:text-ds-danger"
            role="alert"
          >
            <Icon name="bell" size={15} className="si:mt-0.5 si:shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" disabled={status === "submitting"} className="si:w-full si:justify-center si:py-3 si:text-sm">
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export default SignInApp;
