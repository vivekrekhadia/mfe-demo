import { useOutletContext } from "react-router-dom";
import type { Booking } from "./bookings";

/** "/bookings/:cabinSlug" (index) — the default tab of BookingDetail's layout. */
export function BookingOverview() {
  const booking = useOutletContext<Booking>();

  return (
    <div className="mfe-row">
      <div>Check-in: {booking.checkIn}</div>
      <div>Check-out: {booking.checkOut}</div>
      <div className="mfe-note">Dinner reservation confirmed</div>
      <p className="mfe-detail">Booking details for {booking.cabin} confirmed.</p>
    </div>
  );
}
