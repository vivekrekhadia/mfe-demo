import { Link } from "react-router-dom";
import { Badge, Button, HelperNote, RouteErrorBoundary } from "@mfe/design-system";
import { restaurants } from "./dining";
import { ChefSpecial } from "./ChefSpecial";
import { CrashDemo } from "./CrashDemo";

/** "/dining" (index) — links to "/dining/:restaurantSlug", a real URL, not local state. */
export function RestaurantsList() {
  return (
    <section className="mfe-panel">
      <h2>Dining</h2>

      <HelperNote>
        Route: <code>/dining</code> (index) — this whole screen is loaded on demand via Module
        Federation, never bundled into the Shell.
      </HelperNote>

      <h3>Today's restaurants</h3>
      {restaurants.map((r) => (
        <div key={r.slug} className="mfe-row">
          <div className="dn:flex dn:items-center dn:gap-2">
            <div className="mfe-row-title">{r.name}</div>
            <Badge tone="accent">Open now</Badge>
          </div>
          <div>Open {r.hours}</div>
          <div className="dn:flex dn:items-center dn:gap-2 dn:mt-2">
            <Link to={r.slug}>
              <Button>View Restaurant</Button>
            </Link>
          </div>
        </div>
      ))}

      <h3>Chef's special</h3>
      {/* Nested inside its own boundary, separate from the "dining:index"
          one DiningApp.tsx wraps this whole component in — so breaking it
          shows an error only in this one section, right here on the
          Dining home page, with the restaurant list above staying fully
          visible. This is deliberately visible without navigating anywhere
          else: someone presenting this who never clicks into a
          restaurant's Menu (see Menu.tsx for the same pattern one level
          deeper) still sees a real partial-break — of a real feature
          (ChefSpecial's "Notify galley" button), not just an inert demo
          button with nothing behind it. */}
      <RouteErrorBoundary key="crash-demo" id="dining:index:crash-demo" label="Chef's special">
        <ChefSpecial restaurantName="Ocean Restaurant" dish="Grilled Salmon" price="$28" />
        <CrashDemo screen="Chef's special" />
      </RouteErrorBoundary>
    </section>
  );
}
