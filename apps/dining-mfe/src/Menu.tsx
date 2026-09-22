import { useOutletContext } from "react-router-dom";
import type { Restaurant } from "./dining";

/** "/dining/:restaurantSlug" (index) — the default tab of RestaurantDetail's layout. */
export function Menu() {
  const restaurant = useOutletContext<Restaurant>();

  return (
    <div>
      <p className="mfe-note">Menu at {restaurant.name}</p>
      {restaurant.menu.map((item) => (
        <div key={item.name} className="mfe-row">
          <div className="mfe-row-title">{item.name}</div>
          <div>{item.price}</div>
        </div>
      ))}
    </div>
  );
}
