import { rspack } from "@rspack/core";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Pinned explicitly (not left to Module Federation's implicit version
// inference) so a mismatch between what this MFE was built against and
// what's actually loaded at runtime fails loudly (strictVersion below)
// instead of silently sharing whichever @mfe/design-system version another
// independently-released remote happened to load first.
const { version: designSystemVersion } = require("@mfe/design-system/package.json");
// See apps/shell/rspack.config.mjs for why @mfe/shared-state must be a
// version-pinned singleton (it exports a React Context, whose identity
// must match the Shell's Provider exactly). Needed here even though this
// app's own source only imports it indirectly, through @mfe/design-system's
// <HelperNote> — Module Federation's shared scope intercepts an import of
// a registered specifier no matter how deep in the dependency graph it
// comes from, so this MFE would otherwise silently bundle its own,
// differently-identitied copy of the context and never see the Shell's
// real showHelperNotes value.
const { version: sharedStateVersion } = require("@mfe/shared-state/package.json");

export default {
  mode: "production",
  entry: "./src/main.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "auto",
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
      name: "signin",
      filename: "remoteEntry.js",
      library: { type: "var", name: "signin" },
      exposes: {
        "./SignInApp": "./src/SignInApp.tsx",
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
        // Singleton so this MFE's useNavigate()/useSearchParams() share
        // the Shell's single <BrowserRouter> instance rather than mounting
        // a second, disconnected router (see apps/shell/rspack.config.mjs).
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
    port: 5004,
    // Lets the Shell dev server (port 5000) fetch this remoteEntry.js
    // cross-origin during full local federation dev — see
    // apps/shell/.env.local.example.
    headers: { "Access-Control-Allow-Origin": "*" },
  },
};
