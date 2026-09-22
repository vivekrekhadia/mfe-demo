import { Outlet, useOutletContext } from "react-router-dom";
import type { Booking } from "./bookings";

/**
 * "/bookings/:cabinSlug/guests" — itself a layout, not a leaf: it exists
 * only to re-expose the booking it received from BookingDetail's <Outlet>
 * to its own children (GuestsList, GuestDetail). This is what makes
 * "guests" a genuine third level of route nesting rather than just another
 * sibling tab like Itinerary — GuestDetail is a child of a child.
 */
export function GuestsLayout() {
  const booking = useOutletContext<Booking>();
  return <Outlet context={booking} />;
}
