import { Link } from "react-router-dom";
import { useShellState } from "@mfe/shared-state";
import { Badge, Button, HelperNote } from "@mfe/design-system";
import { bookings } from "./bookings";

/**
 * Default view for "/bookings" (the index sub-route). "View Booking" is a
 * real <Link> to "/bookings/:cabinSlug", not local state — so it's a
 * bookmarkable, back/forward-able URL, same as any top-level Shell route.
 */
export function BookingsList() {
  const shellState = useShellState();

  return (
    <section className="mfe-panel">
      <h2>Bookings</h2>

      <HelperNote>
        Route: <code>/bookings</code> (index) — this whole screen is loaded on demand via Module
        Federation, never bundled into the Shell.
      </HelperNote>

      {shellState?.session ? (
        <HelperNote>
          Signed in as <mark className="ds-highlight">{shellState.session.user}</mark> — this
          name is coming straight from the Shell's shared state, not something this MFE fetched
          itself.
        </HelperNote>
      ) : (
        <HelperNote>No Shell state available (standalone dev mode).</HelperNote>
      )}

      <h3>Upcoming bookings</h3>
      {bookings.map((b) => (
        <div key={b.cabin} className="mfe-row">
          <div className="bk:flex bk:items-center bk:gap-2">
            <div className="mfe-row-title">{b.cabin}</div>
            <Badge tone="success">Confirmed</Badge>
          </div>
          <div>Check-in: {b.checkIn}</div>
          <div>Check-out: {b.checkOut}</div>
          <div className="mfe-note">Dinner reservation confirmed</div>
          <div className="bk:flex bk:items-center bk:gap-2 bk:mt-2">
            <Link to={b.cabinSlug}>
              <Button>View Booking</Button>
            </Link>
            {shellState && (
              <Button
                variant="secondary"
                onClick={() => shellState.notify(`Crew notified about ${b.cabin}`)}
              >
                Notify crew
              </Button>
            )}
          </div>
        </div>
      ))}

      {shellState && (
        <HelperNote>
          "Notify crew" calls <code>notify()</code> from <code>@mfe/shared-state</code> — watch
          the bell badge in the Shell's header update instantly. No page reload, no prop passed
          down from the Shell; this MFE is writing directly into state the Shell owns.
        </HelperNote>
      )}
    </section>
  );
}
