import { useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Booking } from "./bookings";

const STOPS = [
  { day: "Day 1", port: "Embarkation - Miami" },
  { day: "Day 3", port: "Nassau, Bahamas" },
  { day: "Day 5", port: "Cozumel, Mexico" },
  { day: "Day 7", port: "Return to Miami" },
];

/** "/bookings/:cabinSlug/itinerary" — a sibling tab of BookingOverview. */
export function BookingItinerary() {
  const booking = useOutletContext<Booking>();

  return (
    <div>
      <HelperNote>
        Route: <code>/bookings/:cabinSlug/itinerary</code> — a literal path segment, sibling to
        the index (Overview) and <code>guests</code> routes, all children of the same{" "}
        <code>:cabinSlug</code> layout.
      </HelperNote>
      <p className="mfe-note">Itinerary for {booking.cabin}</p>
      {STOPS.map((stop) => (
        <div key={stop.day} className="mfe-row">
          <div className="mfe-row-title">{stop.day}</div>
          <div>{stop.port}</div>
        </div>
      ))}
    </div>
  );
}
