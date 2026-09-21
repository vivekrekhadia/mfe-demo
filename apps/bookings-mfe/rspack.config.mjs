import { rspack } from "@rspack/core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// publicPath: "auto" is what makes this remote's chunks resolve correctly
// no matter which release folder remoteEntry.js is eventually served from
// (/mfe/releases/<release>/bookings/) — Rspack infers the base path from
// the actual <script> tag's own src at runtime, so this bundle never needs
// to know its deployment path at build time.
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
      name: "bookings",
      filename: "remoteEntry.js",
      library: { type: "var", name: "bookings" },
      exposes: {
        "./BookingsApp": "./src/BookingsApp.tsx",
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
    port: 5001,
  },
};
