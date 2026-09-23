import { Route, Routes } from "react-router-dom";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("dining/DiningApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";
import { RouteErrorBoundary } from "@mfe/design-system";
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
 *
 * Every route's own element is wrapped in its own <RouteErrorBoundary> —
 * not just one boundary around the whole DiningApp (that's the Shell's
 * job, see RemoteErrorBoundary, which is a coarser last line of defense).
 * This means a crash in, say, Menu shows an error only in Menu's own slot;
 * RestaurantDetail's header/tabs stay up, and Reviews is unaffected.
 *
 * Both `key` and `id` on each are required, not decorative — and serve two
 * different purposes:
 *  - `key` (React's own prop): Menu and Reviews render at the exact same
 *    <Outlet> position, both wrapped in the same RouteErrorBoundary
 *    component type. Without distinct keys, navigating between them would
 *    have React reuse the same boundary instance across routes it was
 *    never meant to represent (a crash on one showing no matter which you
 *    navigate to next) instead of properly unmounting/remounting.
 *  - `id` (RouteErrorBoundary's own prop, namespaced "dining:..."): a
 *    crash is meant to stay visible even after navigating away and back
 *    (see RouteErrorBoundary's own comment for why) — so each boundary
 *    looks up its OWN persisted broken/not-broken status by this id every
 *    time it (re)mounts, rather than always starting fresh.
 */
export function DiningApp() {
  return (
    <Routes>
      <Route
        index
        element={
          <RouteErrorBoundary key="index" id="dining:index" label="Dining home">
            <RestaurantsList />
          </RouteErrorBoundary>
        }
      />
      <Route
        path=":restaurantSlug"
        element={
          <RouteErrorBoundary key="detail" id="dining:detail" label="Restaurant details">
            <RestaurantDetail />
          </RouteErrorBoundary>
        }
      >
        <Route
          index
          element={
            <RouteErrorBoundary key="menu" id="dining:menu" label="Menu">
              <Menu />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="reviews"
          element={
            <RouteErrorBoundary key="reviews-layout" id="dining:reviews-layout" label="Reviews">
              <ReviewsLayout />
            </RouteErrorBoundary>
          }
        >
          <Route
            index
            element={
              <RouteErrorBoundary key="reviews-index" id="dining:reviews-index" label="Reviews">
                <ReviewsList />
              </RouteErrorBoundary>
            }
          />
          <Route
            path=":reviewId"
            element={
              <RouteErrorBoundary key="review-detail" id="dining:review-detail" label="Review">
                <ReviewDetail />
              </RouteErrorBoundary>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default DiningApp;
