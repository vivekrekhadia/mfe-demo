import { Link } from "react-router-dom";
import { Badge, Button, HelperNote } from "@mfe/design-system";
import { restaurants } from "./dining";
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

      <CrashDemo screen="Dining home" />
    </section>
  );
}
