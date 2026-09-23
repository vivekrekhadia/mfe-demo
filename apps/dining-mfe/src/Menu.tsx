import { useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Restaurant } from "./dining";
import { CrashDemo } from "./CrashDemo";

/** "/dining/:restaurantSlug" (index) — the default tab of RestaurantDetail's layout. */
export function Menu() {
  const restaurant = useOutletContext<Restaurant>();

  return (
    <div>
      <HelperNote>
        This is the <strong>index route</strong> of <code>/dining/:restaurantSlug</code> — no
        path segment of its own, rendered by default when <code>reviews</code> isn't present. A
        sibling <code>&lt;Route index&gt;</code> to it.
      </HelperNote>
      <p className="mfe-note">Menu at {restaurant.name}</p>
      {restaurant.menu.map((item) => (
        <div key={item.name} className="mfe-row">
          <div className="mfe-row-title">{item.name}</div>
          <div>{item.price}</div>
        </div>
      ))}

      <CrashDemo screen="Menu" />
    </div>
  );
}
