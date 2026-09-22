import { useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Booking } from "./bookings";

/** "/bookings/:cabinSlug" (index) — the default tab of BookingDetail's layout. */
export function BookingOverview() {
  const booking = useOutletContext<Booking>();

  return (
    <div className="mfe-row">
      <HelperNote>
        This is the <strong>index route</strong> of <code>/bookings/:cabinSlug</code> — no path
        segment of its own, rendered by default when neither <code>itinerary</code> nor{" "}
        <code>guests</code> is present. A sibling <code>&lt;Route index&gt;</code> to those two.
      </HelperNote>
      <div>Check-in: {booking.checkIn}</div>
      <div>Check-out: {booking.checkOut}</div>
      <div className="mfe-note">Dinner reservation confirmed</div>
      <p className="mfe-detail">Booking details for {booking.cabin} confirmed.</p>
    </div>
  );
}
