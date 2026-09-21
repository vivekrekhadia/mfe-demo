import React from "react";
import ReactDOM from "react-dom/client";
import "@mfe/design-system/styles.css";
// Only for standalone dev parity with what the Shell provides in
// production (see PaymentApp.tsx for why this doesn't live there).
import "@mfe/design-system/tailwind.css";
import { PaymentApp } from "./PaymentApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 480 }}>
      <p style={{ opacity: 0.6, fontSize: 13 }}>
        Standalone dev mode — normally rendered inside the Shell via Module Federation.
      </p>
      <PaymentApp />
    </div>
  </React.StrictMode>,
);
