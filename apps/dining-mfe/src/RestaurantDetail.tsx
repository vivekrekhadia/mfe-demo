import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { Icon, HelperNote } from "@mfe/design-system";
import { findRestaurantBySlug } from "./dining";

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? "mfe-tab mfe-tab-active" : "mfe-tab");

/**
 * Layout for "/dining/:restaurantSlug". Renders the restaurant's own
 * sub-nav (Menu / Reviews) and an <Outlet /> for whichever child route
 * currently matches, passing the resolved restaurant down via route
 * context so children don't need to re-look it up by slug.
 */
export function RestaurantDetail() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const restaurant = restaurantSlug ? findRestaurantBySlug(restaurantSlug) : undefined;

  return (
    <section className="mfe-panel">
      <h2>Dining</h2>
      <Link to="/dining" className="mfe-back-link">
        <Icon name="chevron-left" size={14} />
        Back to dining
      </Link>

      {restaurant ? (
        <>
          <h3>{restaurant.name}</h3>
          <HelperNote>
            Route: <code>/dining/{restaurantSlug}</code> — a layout, not a leaf: it renders the
            tabs below and an <code>&lt;Outlet&gt;</code> for whichever child route currently
            matches (Menu, Reviews). Both are routes this MFE owns entirely — the Shell's own
            route config only ever says <code>/dining/*</code>.
          </HelperNote>
          <nav className="mfe-subnav">
            <NavLink end to="." className={tabClass}>
              Menu
            </NavLink>
            <NavLink to="reviews" className={tabClass}>
              Reviews
            </NavLink>
          </nav>
          <Outlet context={restaurant} />
        </>
      ) : (
        <p className="mfe-detail">No restaurant found for "{restaurantSlug}".</p>
      )}
    </section>
  );
}
