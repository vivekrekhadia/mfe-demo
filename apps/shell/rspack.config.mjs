import { rspack } from "@rspack/core";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Pinned explicitly (not left to Module Federation's implicit version
// inference) so a mismatch between what the Shell was built against and
// what's actually loaded at runtime fails loudly (strictVersion below)
// instead of silently sharing whichever @mfe/design-system version an
// independently-released remote happened to load first.
const { version: designSystemVersion } = require("@mfe/design-system/package.json");
// Same reasoning as @mfe/design-system: shared-state's value is a React
// Context object. Two independently-bundled copies of createContext() are
// two different identities, so this MUST be a version-pinned singleton or
// an MFE's useShellState() would silently read the default (null) value
// instead of the Shell's actual Provider.
const { version: sharedStateVersion } = require("@mfe/shared-state/package.json");

// Dev-only manifest override. Reads apps/shell/.env.local (gitignored, see
// .env.local.example) if present. ship:build never has this file, so a
// production build always gets MFE_MANIFEST_URL = "" and falls back to the
// real Ship Server manifest path — see resolveManifestUrl() in
// src/manifest/fetchManifest.ts.
function readLocalManifestUrl() {
  const envPath = path.resolve(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return "";
  const line = fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("MFE_MANIFEST_URL="));
  return line ? line.slice("MFE_MANIFEST_URL=".length).trim() : "";
}

// --- The core of "runtime composition" ---
//
// Each remote is declared here only as a NAME ("bookings", "dining",
// "payment") — never as a URL. This is Rspack/webpack's standard "dynamic
// remote" pattern (a `promise`-prefixed string is executed as literal JS by
// the federation runtime the moment that remote's container is first
// requested): it script-injects whatever remoteEntry.js URL is currently
// sitting in `window.__SHIP_MANIFEST__` — the object the Shell populates by
// fetching /config/mfe-manifest.json from the Ship Server on startup (see
// src/manifest/useShipManifest.ts) — and resolves with the resulting
// container once it has loaded.
//
// This means the Shell bundle contains NO reference to any concrete
// remoteEntry.js path or release folder. Swapping the active release on the
// Ship Server (via ship:activate / ship:rollback) changes what these
// promises resolve to without rebuilding or redeploying the Shell.
function dynamicRemote(name) {
  return `promise new Promise((resolve, reject) => {
    if (window.${name}) {
      resolve(window.${name});
      return;
    }
    var manifest = window.__SHIP_MANIFEST__;
    var entry = manifest && manifest.mfes && manifest.mfes.${name};
    if (!entry) {
      reject(new Error("${name} is not present in the active ship manifest"));
      return;
    }
    var script = document.createElement("script");
    script.src = entry.url;
    script.type = "text/javascript";
    script.onload = function () {
      if (window.${name}) {
        resolve(window.${name});
      } else {
        reject(new Error("${name} remoteEntry.js loaded but did not register window.${name}"));
      }
    };
    script.onerror = function () {
      reject(new Error("Failed to load ${name} remoteEntry.js from " + entry.url));
    };
    document.head.appendChild(script);
  })`;
}

export default {
  mode: "production",
  entry: "./src/main.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
        type: "javascript/auto",
      },
      { test: /\.css$/, type: "css" },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      MFE_MANIFEST_URL: JSON.stringify(readLocalManifestUrl()),
    }),
    new rspack.container.ModuleFederationPlugin({
      name: "shell",
      remotes: {
        bookings: dynamicRemote("bookings"),
        dining: dynamicRemote("dining"),
        payment: dynamicRemote("payment"),
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
        // Singleton so a nested <Routes> declared inside an MFE (e.g.
        // Bookings' sub-routes) shares the same router context the Shell's
        // <BrowserRouter> created, instead of a second react-router-dom
        // instance that can't see the Shell's history/location.
        "react-router-dom": { singleton: true },
        "@mfe/design-system": {
          singleton: true,
          requiredVersion: designSystemVersion,
          strictVersion: true,
        },
        "@mfe/shared-state": {
          singleton: true,
          requiredVersion: sharedStateVersion,
          strictVersion: true,
        },
      },
    }),
    new rspack.HtmlRspackPlugin({ template: "./index.html" }),
  ],
  devServer: {
    port: 5000,
    historyApiFallback: true,
    // Serves apps/shell/public/manifest.local.json (gitignored — copy from
    // manifest.local.json.example) at http://localhost:5000/manifest.local.json
    // for the full-local-federation dev mode described in .env.local.example.
    static: { directory: path.resolve(__dirname, "public") },
  },
};
