import type { MfeManifest } from "@mfe/shared-types";

declare global {
  interface Window {
    /**
     * Populated once, at Shell startup, from /config/mfe-manifest.json.
     * The generated Module Federation remote loaders (see rspack.config.mjs)
     * read this at the moment a remote is first imported — this is what
     * makes the remote URLs fully runtime-resolved instead of hard-coded.
     */
    __SHIP_MANIFEST__?: MfeManifest;
  }
}

export {};
