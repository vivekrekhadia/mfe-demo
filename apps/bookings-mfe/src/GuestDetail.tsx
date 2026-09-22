import { Link, useOutletContext, useParams } from "react-router-dom";
import { Icon, HelperNote } from "@mfe/design-system";
import type { Booking } from "./bookings";

/**
 * "/bookings/:cabinSlug/guests/:guestId" — a child of GuestsLayout, which
 * is itself a child of BookingDetail: three <Route> levels deep, all
 * within this one MFE, all still under the Shell's single "/bookings/*"
 * mount point.
 */
export function GuestDetail() {
  const booking = useOutletContext<Booking>();
  const { guestId } = useParams<{ guestId: string }>();
  const guest = booking.guests.find((g) => g.id === guestId);

  return (
    <div>
      {/* Relative, unlike the "back to bookings" link in BookingDetail:
          this only needs to go up one level within the nested route tree
          (guests/:guestId -> guests), not escape the MFE's own mount
          boundary, so relative resolution is unambiguous here. */}
      <Link to=".." className="mfe-back-link">
        <Icon name="chevron-left" size={14} />
        Back to guests
      </Link>
      <HelperNote>
        Route: <code>/bookings/:cabinSlug/guests/:guestId</code> — the deepest leaf in this MFE,
        three <code>&lt;Route&gt;</code> levels below where the Shell mounted it. Its{" "}
        <code>guestId</code> param and the <code>booking</code> passed down through two layers of{" "}
        <code>&lt;Outlet context&gt;</code> (BookingDetail then GuestsLayout) both resolve here.
      </HelperNote>
      {guest ? (
        <div className="mfe-row">
          <div className="mfe-row-title">{guest.name}</div>
          <div>Age {guest.age}</div>
          <p className="mfe-detail">Guest confirmed for {booking.cabin}.</p>
        </div>
      ) : (
        <p className="mfe-detail">No guest found with id "{guestId}".</p>
      )}
    </div>
  );
}
