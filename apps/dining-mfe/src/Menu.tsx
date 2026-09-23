import { useOutletContext } from "react-router-dom";
import { HelperNote, RouteErrorBoundary } from "@mfe/design-system";
import type { Restaurant } from "./dining";
import { ChefSpecial } from "./ChefSpecial";
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

      {/* Same nesting reasoning as RestaurantsList.tsx: a boundary around
          just this section, separate from the "dining:menu" one wrapping
          this whole component, so breaking it leaves the menu items above
          visible instead of replacing this whole screen — and takes down
          a real feature (ChefSpecial's "Notify galley" button), not an
          inert demo button with nothing behind it. */}
      <RouteErrorBoundary key="crash-demo" id="dining:menu:crash-demo" label="Chef's special">
        <ChefSpecial
          restaurantName={restaurant.name}
          dish={restaurant.menu[0].name}
          price={restaurant.menu[0].price}
        />
        <CrashDemo screen="Chef's special" />
      </RouteErrorBoundary>
    </div>
  );
}
