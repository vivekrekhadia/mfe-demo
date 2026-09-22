import { Route, Routes } from "react-router-dom";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("dining/DiningApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";
import { RestaurantsList } from "./RestaurantsList";
import { RestaurantDetail } from "./RestaurantDetail";
import { Menu } from "./Menu";
import { ReviewsLayout } from "./ReviewsLayout";
import { ReviewsList } from "./ReviewsList";
import { ReviewDetail } from "./ReviewDetail";

/**
 * Mounted by the Shell at "/dining/*" — same pattern as Bookings (see
 * apps/bookings-mfe/src/BookingsApp.tsx for the full explanation of why
 * "/*" and the shared react-router-dom singleton matter). Three levels
 * deep here too:
 *
 *   /dining                             RestaurantsList   (level 1)
 *   /dining/:restaurantSlug             RestaurantDetail   (level 2 layout, Menu tab is its index)
 *   /dining/:restaurantSlug/reviews     ReviewsLayout       (level 2 sibling, itself a layout)
 *   /dining/:restaurantSlug/reviews/:id ReviewDetail          (level 3 — a child of a child)
 */
export function DiningApp() {
  return (
    <Routes>
      <Route index element={<RestaurantsList />} />
      <Route path=":restaurantSlug" element={<RestaurantDetail />}>
        <Route index element={<Menu />} />
        <Route path="reviews" element={<ReviewsLayout />}>
          <Route index element={<ReviewsList />} />
          <Route path=":reviewId" element={<ReviewDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default DiningApp;
