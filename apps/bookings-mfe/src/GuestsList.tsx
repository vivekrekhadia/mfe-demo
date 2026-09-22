import { Link, useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Booking } from "./bookings";

/** "/bookings/:cabinSlug/guests" (index) — one level below GuestsLayout. */
export function GuestsList() {
  const booking = useOutletContext<Booking>();

  return (
    <div>
      <HelperNote>
        Route: <code>/bookings/:cabinSlug/guests</code> (index). This and its sibling{" "}
        <code>/guests/:guestId</code> are a third level of nested <code>&lt;Route&gt;</code> — a
        child of a child — still entirely inside this one MFE. GuestsLayout.tsx (the parent
        route) renders no UI of its own, only an <code>&lt;Outlet&gt;</code>.
      </HelperNote>
      <p className="mfe-note">Guests in {booking.cabin}</p>
      {booking.guests.map((guest) => (
        <div key={guest.id} className="mfe-row">
          <div className="mfe-row-title">{guest.name}</div>
          <div>Age {guest.age}</div>
          <div className="bk:mt-1">
            <Link to={guest.id}>View guest &rarr;</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
