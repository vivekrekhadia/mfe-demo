import { useState } from "react";
import { Button } from "@mfe/design-system";

interface CrashDemoProps {
  /** What screen this instance is embedded in — shown in the button/copy and thrown as the error's own message, so RouteErrorBoundary's fallback says exactly which demo triggered it. */
  screen: string;
}

/**
 * Demo-only: throws during render on purpose. Used in two places
 * (RestaurantsList and Menu — see DiningApp.tsx) specifically to prove
 * error boundaries are scoped **per route**, not per MFE: breaking Menu
 * shows an error only in Menu's own slot — RestaurantDetail's header,
 * "Back to dining" link, and Menu/Reviews tabs stay up and clickable,
 * Reviews is unaffected, and switching to Reviews and back to Menu clears
 * it automatically (RouteErrorBoundary remounts fresh whenever you
 * navigate to a different route — no "Retry" press required for that;
 * "Retry" is for recovering without leaving the route at all).
 */
export function CrashDemo({ screen }: CrashDemoProps) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    throw new Error(`${screen} crashed on purpose (crash demo button)`);
  }

  return (
    <div className="dn:mt-6">
      <h3>Crash demo (error boundary)</h3>
      {/* Plain red text, not <HelperNote>: that hides when the presenter turns helper notes
          off, and this warning must stay visible — it marks the button that breaks the page. */}
      <p className="dn:text-ds-danger dn:font-semibold">
        Throws inside just this screen's render — only this slot shows an error; everything
        around it (layout, tabs, other routes) keeps working.
      </p>
      <Button
        variant="secondary"
        className="dn:mt-2 dn:border-ds-danger dn:text-ds-danger"
        onClick={() => setBroken(true)}
      >
        Break {screen}
      </Button>
    </div>
  );
}
