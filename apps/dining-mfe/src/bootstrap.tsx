import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@mfe/design-system/styles.css";
// Only for standalone dev parity with what the Shell provides in
// production (see DiningApp.tsx for why this doesn't live there).
import "@mfe/design-system/tailwind.css";
import { HelperNote } from "@mfe/design-system";
import { DiningApp } from "./DiningApp";

// DiningApp owns its own <Routes> (nested restaurant/review sub-routes), so
// standalone mode needs its own <BrowserRouter> too — in production this
// comes from the Shell's single <BrowserRouter> instead (see
// apps/shell/src/bootstrap.tsx).
//
// The .mfe-slot wrapper here is the same card the Shell's RemoteLoader
// wraps this component in during production (see @mfe/design-system's
// styles.css) — reused here so standalone dev mode looks like the real
// thing, not just Preflight-reset plain text.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div style={{ maxWidth: 480, margin: "24px auto", padding: "0 16px" }}>
        <HelperNote>
          Standalone dev mode — normally rendered inside the Shell via Module Federation.
          There's no ShellStateProvider here, so shared state and the "Hide notes" toggle aren't
          available; every <code>HelperNote</code> renders unconditionally instead.
        </HelperNote>
        <div className="mfe-slot">
          <DiningApp />
        </div>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
);
