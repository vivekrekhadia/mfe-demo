import { Link, useOutletContext, useParams } from "react-router-dom";
import { Icon, HelperNote } from "@mfe/design-system";
import type { Restaurant } from "./dining";

/**
 * "/dining/:restaurantSlug/reviews/:reviewId" — a child of ReviewsLayout,
 * which is itself a child of RestaurantDetail: three <Route> levels deep,
 * all within this one MFE, all still under the Shell's single
 * "/dining/*" mount point.
 */
export function ReviewDetail() {
  const restaurant = useOutletContext<Restaurant>();
  const { reviewId } = useParams<{ reviewId: string }>();
  const review = restaurant.reviews.find((r) => r.id === reviewId);

  return (
    <div>
      <Link to=".." className="mfe-back-link">
        <Icon name="chevron-left" size={14} />
        Back to reviews
      </Link>
      <HelperNote>
        Route: <code>/dining/:restaurantSlug/reviews/:reviewId</code> — the deepest leaf in this
        MFE, three <code>&lt;Route&gt;</code> levels below where the Shell mounted it. Its{" "}
        <code>reviewId</code> param and the <code>restaurant</code> passed down through two
        layers of <code>&lt;Outlet context&gt;</code> (RestaurantDetail then ReviewsLayout) both
        resolve here.
      </HelperNote>
      {review ? (
        <div className="mfe-row">
          <div className="mfe-row-title">{review.author}</div>
          <p className="mfe-detail">{review.comment}</p>
        </div>
      ) : (
        <p className="mfe-detail">No review found with id "{reviewId}".</p>
      )}
    </div>
  );
}
