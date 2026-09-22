import { useState } from "react";
import { Button, HelperNote, Icon } from "@mfe/design-system";
import { CREW_LOG_PATH } from "@mfe/shared-config";

interface CrewLogEntry {
  time: string;
  note: string;
}

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; entries: CrewLogEntry[] }
  | { status: "error"; message: string };

/**
 * Demo-only: proves the session cookie set by sign-in (see
 * apps/signin-mfe/src/SignInApp.tsx) really does gate a protected Ship
 * Server endpoint, from inside an ordinary MFE — not just the Shell's own
 * /api/session check. Two buttons call the exact same GET /api/crew-log:
 * one with `credentials: "include"` (the normal way every real fetch in
 * this app is made — see README "Authentication"), one with `credentials:
 * "omit"` to simulate a request with no token at all. This MFE never
 * touches the session token itself either way — the browser attaches (or
 * withholds) the httpOnly cookie, and the Ship Server is what actually
 * enforces the 401.
 */
export function CrewLogDemo() {
  const [result, setResult] = useState<Result>({ status: "idle" });

  async function load(withSession: boolean) {
    setResult({ status: "loading" });
    try {
      const response = await fetch(CREW_LOG_PATH, {
        credentials: withSession ? "include" : "omit",
      });
      if (!response.ok) {
        setResult({
          status: "error",
          message: withSession
            ? `Unexpected ${response.status} — your session may have expired, try signing in again.`
            : `${response.status} as expected — no session cookie was sent, so the Ship Server refused the request.`,
        });
        return;
      }
      const data: { entries: CrewLogEntry[] } = await response.json();
      setResult({ status: "success", entries: data.entries });
    } catch {
      setResult({ status: "error", message: "Could not reach the Ship Server." });
    }
  }

  return (
    <div>
      <h3>Crew log (token check demo)</h3>
      <HelperNote>
        Both buttons call the same protected <code>GET /api/crew-log</code> — one sends your{" "}
        <code>ship_session</code> cookie, the other omits it, so you can compare the response.
      </HelperNote>

      <div className="bk:flex bk:items-center bk:gap-2 bk:mt-2">
        <Button onClick={() => void load(true)} disabled={result.status === "loading"}>
          Load crew log (with session)
        </Button>
        <Button variant="secondary" onClick={() => void load(false)} disabled={result.status === "loading"}>
          Load crew log (without session)
        </Button>
      </div>

      {result.status === "loading" && (
        // .mfe-slot-loading / .mfe-skeleton-line live in
        // @mfe/design-system/styles.css (shared, not Shell-only — see that
        // file's header comment) specifically so this MFE's own in-page
        // fetch can show the same skeleton look the Shell uses while a
        // remote loads, instead of showing nothing while this request is
        // in flight.
        <div className="mfe-slot-loading bk:mt-3" aria-label="Loading crew log">
          <div className="mfe-skeleton-line" style={{ width: "45%" }} />
          <div className="mfe-skeleton-line" style={{ width: "80%" }} />
          <div className="mfe-skeleton-line" style={{ width: "60%" }} />
        </div>
      )}

      {result.status === "success" && (
        <ul className="bk:mt-3 bk:flex bk:flex-col bk:gap-1 bk:text-sm">
          {result.entries.map((entry) => (
            <li key={entry.time}>
              <strong>{entry.time}</strong> — {entry.note}
            </li>
          ))}
        </ul>
      )}

      {result.status === "error" && (
        // Deliberately NOT .mfe-note: that class is un-layered CSS (see
        // @mfe/design-system/styles.css), so it always wins over a Tailwind
        // utility class (which lives inside @layer utilities) regardless of
        // source order — it would silently force this back to its own
        // green/12.5px styling no matter what color/size utility is added.
        // Also deliberately not the Shell's .mfe-slot-error classes: those
        // are Shell-only chrome (see apps/shell/src/styles.css), never
        // loaded when this MFE runs standalone (bootstrap.tsx) — so this
        // banner is styled from scratch with classes this MFE always has.
        <div
          className="bk:mt-3 bk:flex bk:items-start bk:gap-2 bk:rounded-ds-md bk:border bk:border-ds-danger/25 bk:bg-ds-danger-bg bk:px-3 bk:py-2.5 bk:text-sm bk:text-ds-danger"
          role="alert"
        >
          <Icon name="bell" size={15} className="bk:mt-0.5 bk:shrink-0" />
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
