import type { MfeManifest } from "@mfe/shared-types";

export function ReleaseInfo({ manifest }: { manifest: MfeManifest }) {
  return (
    <div className="release-bar">
      <span className="release-bar-main">Current Release: {manifest.release}</span>
      <span className="release-bar-versions">
        Bookings {manifest.mfes.bookings.version} · Dining {manifest.mfes.dining.version} · Payment{" "}
        {manifest.mfes.payment.version}
      </span>
    </div>
  );
}
