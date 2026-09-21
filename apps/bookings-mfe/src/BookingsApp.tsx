import { useState } from "react";
import { Button } from "@mfe/design-system";

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
          <Button onClick={() => setViewing(b.cabin)}>View Booking</Button>
        </div>
      ))}
      {viewing && <p className="mfe-detail">Booking details for {viewing} confirmed.</p>}
    </section>
  );
}

export default BookingsApp;
