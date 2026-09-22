import { Outlet, useOutletContext } from "react-router-dom";
import type { Restaurant } from "./dining";

/**
 * "/dining/:restaurantSlug/reviews" — itself a layout, not a leaf: it
 * re-exposes the restaurant it received from RestaurantDetail's <Outlet>
 * to its own children (ReviewsList, ReviewDetail). This is what makes
 * "reviews" a genuine third level of route nesting — ReviewDetail is a
 * child of a child.
 */
export function ReviewsLayout() {
  const restaurant = useOutletContext<Restaurant>();
  return <Outlet context={restaurant} />;
}
