import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@mfe/design-system/styles.css";
// Only for standalone dev parity with what the Shell provides in
// production (see BookingsApp.tsx for why this doesn't live there).
import "@mfe/design-system/tailwind.css";
import { HelperNote } from "@mfe/design-system";
import { BookingsApp } from "./BookingsApp";

// Standalone entry point used only for isolated development of this MFE
// (`pnpm --filter @mfe/bookings-mfe dev`). In production this component is
// never rendered from here — the Shell loads it dynamically through
// Module Federation via the manifest-resolved remoteEntry.js.
//
// BookingsApp now owns its own <Routes> (sub-routes like /:cabinSlug), so
// standalone mode needs its own <BrowserRouter> too — in production this
// comes from the Shell's single <BrowserRouter> instead (see
// apps/shell/src/bootstrap.tsx). There's no ShellStateProvider here, so
// useShellState() correctly returns null in this mode (see BookingsList.tsx).
//
// basename is derived from the current URL rather than hardcoded, because
// this same bundle is served from a different path depending on where it's
// deployed: "/" for local dev (localhost:5001), "/mfe/bookings" for the
// Vercel static demo, and "/mfe/releases/<release>/bookings" under the ship
// server (see the publicPath comment in rspack.config.mjs). Whatever path
// this index.html was actually loaded from IS that prefix, since this
// standalone entry is only ever loaded fresh at its own root (deep links
// into sub-routes aren't served statically, so there's no other pathname
// this could see at initial load).
//
// The .mfe-slot wrapper here is the same card the Shell's RemoteLoader
// wraps this component in during production (see @mfe/design-system's
// styles.css) — reused here so standalone dev mode looks like the real
// thing, not just Preflight-reset plain text.
const standaloneBasename = window.location.pathname.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={standaloneBasename}>
      <div style={{ maxWidth: 480, margin: "24px auto", padding: "0 16px" }}>
        <HelperNote>
          Standalone dev mode — normally rendered inside the Shell via Module Federation.
          There's no ShellStateProvider here, so shared state and the "Hide notes" toggle aren't
          available; every <code>HelperNote</code> renders unconditionally instead.
        </HelperNote>
        <div className="mfe-slot">
          <BookingsApp />
        </div>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
);
