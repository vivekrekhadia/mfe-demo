import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    federation({
      name: "dining",
      filename: "remoteEntry.js",
      exposes: {
        "./DiningApp": "./src/DiningApp.tsx",
      },
      shared: ["react", "react-dom"],
    }),
],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
    assetsDir: "",
  },
  server: {
    port: 5002,
  },
});
