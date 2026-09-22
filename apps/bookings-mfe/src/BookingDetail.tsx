import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { Icon, HelperNote } from "@mfe/design-system";
import { findBookingBySlug } from "./bookings";

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? "mfe-tab mfe-tab-active" : "mfe-tab");

/**
 * Layout for "/bookings/:cabinSlug" — a sub-route this MFE owns entirely,
 * the Shell has no idea this URL, or this component, exists. Renders the
 * booking's own sub-nav (Overview / Itinerary / Guests) and an <Outlet />
 * for whichever of its child routes currently matches, passing the
 * resolved booking down via route context so children don't need to
 * re-look it up by slug.
 *
 * A hard refresh on any of these deep links works too, since the Ship
 * Server's catch-all serves the Shell's index.html for any non-asset path
 * (see apps/ship-server/server.mjs).
 */
export function BookingDetail() {
  const { cabinSlug } = useParams<{ cabinSlug: string }>();
  const booking = cabinSlug ? findBookingBySlug(cabinSlug) : undefined;

  return (
    <section className="mfe-panel">
      <h2>Bookings</h2>
      {/* Absolute, not relative — this MFE is always mounted at
          "/bookings" by the Shell (see apps/shell/src/App.tsx), so this
          is unambiguous no matter how deep the current sub-route is. */}
      <Link to="/bookings" className="mfe-back-link">
        <Icon name="chevron-left" size={14} />
        Back to bookings
      </Link>

      {booking ? (
        <>
          <h3>{booking.cabin}</h3>
          <HelperNote>
            Route: <code>/bookings/{cabinSlug}</code> — a layout, not a leaf: it renders the tabs
            below and an <code>&lt;Outlet&gt;</code> for whichever child route currently matches
            (Overview, Itinerary, Guests). All three are routes this MFE owns entirely — the
            Shell's own route config only ever says <code>/bookings/*</code>. Renaming or adding
            a tab here needs no Shell change or redeploy.
          </HelperNote>
          <nav className="mfe-subnav">
            <NavLink end to="." className={tabClass}>
              Overview
            </NavLink>
            <NavLink to="itinerary" className={tabClass}>
              Itinerary
            </NavLink>
            <NavLink to="guests" className={tabClass}>
              Guests
            </NavLink>
          </nav>
          <Outlet context={booking} />
        </>
      ) : (
        <p className="mfe-detail">No booking found for cabin "{cabinSlug}".</p>
      )}
    </section>
  );
}
