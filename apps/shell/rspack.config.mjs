import { rspack } from "@rspack/core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        "@mfe/design-system": { singleton: true },
      },
    }),
    new rspack.HtmlRspackPlugin({ template: "./index.html" }),
  ],
  devServer: {
    port: 5000,
    historyApiFallback: true,
  },
};
