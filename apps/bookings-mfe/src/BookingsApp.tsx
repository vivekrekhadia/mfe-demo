import { useState } from "react";
import { Button } from "@mfe/design-system";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("bookings/BookingsApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";

interface Booking {
  cabin: string;
  checkIn: string;
  checkOut: string;
}

const bookings: Booking[] = [{ cabin: "Cabin 1204", checkIn: "20 Sep", checkOut: "27 Sep" }];

export function BookingsApp() {
  const [viewing, setViewing] = useState<string | null>(null);

  return (
    <section className="mfe-panel">
      <h2>Bookings</h2>
      <h3>Upcoming bookings</h3>
      {bookings.map((b) => (
        <div key={b.cabin} className="mfe-row">
          <div className="mfe-row-title">{b.cabin}</div>
          <div>Check-in: {b.checkIn}</div>
          <div>Check-out: {b.checkOut}</div>
          <div className="mfe-note">Dinner reservation confirmed</div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setViewing(b.cabin)}>View Booking</Button>
            <span className="rounded-ds-pill bg-ds-navy px-3 py-1 text-xs text-white">Tailwind-styled tag</span>
          </div>
        </div>
      ))}
      {viewing && <p className="mfe-detail">Booking details for {viewing} confirmed.</p>}
    </section>
  );
}

export default BookingsApp;
