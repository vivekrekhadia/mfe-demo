import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "@mfe/design-system/styles.css";
import "./styles.css";

// Route-based MFEs per the agreed MFE standards: which remote is mounted is
// determined by the URL, owned by the Shell's router — not by component
// state. The Ship Server's catch-all (see apps/ship-server/server.mjs)
// serves the Shell's index.html for any non-asset path, so deep links like
// /dining work on a hard refresh, not just client-side navigation.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
