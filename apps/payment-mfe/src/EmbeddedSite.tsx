import { HelperNote } from "@mfe/design-system";

// bbc.com can't be used here: it sends `X-Frame-Options: SAMEORIGIN`, so
// browsers refuse to render it in any third-party iframe. Wikipedia permits
// framing, so it stands in for the demo. Change this to any embeddable URL.
const EMBED_URL = "https://en.wikipedia.org/wiki/Cruise_ship";

/** Small third-party page embedded via <iframe> (demo). */
export function EmbeddedSite() {
  return (
    <>
      <HelperNote>
        Embedded page: an external site loaded in an <code>&lt;iframe&gt;</code> inside this MFE,
        to show a third-party page can sit within a micro frontend. Needs internet access, so it
        stays blank offline on the ship.
      </HelperNote>
      <div style={{ width: "100%", maxWidth: 480, height: 240, margin: "12px 0", border: "1px solid #d0d7de", borderRadius: 8, overflow: "hidden" }}>
        <iframe
          title="Embedded site demo"
          src={EMBED_URL}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </>
  );
}
