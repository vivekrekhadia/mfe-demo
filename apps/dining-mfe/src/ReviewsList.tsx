import { Link, useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Restaurant } from "./dining";

/** "/dining/:restaurantSlug/reviews" (index) — one level below ReviewsLayout. */
export function ReviewsList() {
  const restaurant = useOutletContext<Restaurant>();

  return (
    <div>
      <HelperNote>
        Route: <code>/dining/:restaurantSlug/reviews</code> (index). This and its sibling{" "}
        <code>/reviews/:reviewId</code> are a third level of nested <code>&lt;Route&gt;</code> —
        a child of a child — still entirely inside this one MFE. ReviewsLayout.tsx (the parent
        route) renders no UI of its own, only an <code>&lt;Outlet&gt;</code>.
      </HelperNote>
      <p className="mfe-note">Reviews for {restaurant.name}</p>
      {restaurant.reviews.map((review) => (
        <div key={review.id} className="mfe-row">
          <div className="mfe-row-title">{review.author}</div>
          <div className="dn:mt-1">
            <Link to={review.id}>Read review &rarr;</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
