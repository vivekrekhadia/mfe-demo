import { Link } from "react-router-dom";
import { Badge, Button, HelperNote } from "@mfe/design-system";
import { restaurants } from "./dining";

/** "/dining" (index) — links to "/dining/:restaurantSlug", a real URL, not local state. */
export function RestaurantsList() {
  return (
    <section className="mfe-panel">
      <h2>Dining</h2>

      <HelperNote>
        This whole screen is the <code>dining</code> remote's own <code>RestaurantsList</code>{" "}
        component — loaded on demand via <code>import("dining/DiningApp")</code>, never bundled
        into the Shell (see apps/shell/src/federation/remoteImports.ts).
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
    </section>
  );
}
