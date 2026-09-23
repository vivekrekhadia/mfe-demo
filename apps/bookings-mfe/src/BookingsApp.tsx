import { Route, Routes } from "react-router-dom";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("bookings/BookingsApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";
import { RouteErrorBoundary } from "@mfe/design-system";
import { BookingsList } from "./BookingsList";
import { BookingDetail } from "./BookingDetail";
import { BookingOverview } from "./BookingOverview";
import { BookingItinerary } from "./BookingItinerary";
import { GuestsLayout } from "./GuestsLayout";
import { GuestsList } from "./GuestsList";
import { GuestDetail } from "./GuestDetail";

/**
 * Mounted by the Shell at "/bookings/*" (see apps/shell/src/App.tsx). The
 * "/*" is what lets this component own sub-routes of its own — the Shell
 * never needs to know any of this exists. These <Routes> are relative to
 * wherever the Shell mounted this component, and they share the Shell's
 * single <BrowserRouter> instance (react-router-dom is a Module Federation
 * singleton — see rspack.config.mjs), so browser back/forward and
 * deep-linking work exactly as if this were one app.
 *
 * Three levels deep, to show routes can nest as far as any single-repo app
 * would nest them:
 *
 *   /bookings                          BookingsList        (level 1)
 *   /bookings/:cabinSlug               BookingDetail        (level 2, a layout with its own sub-nav + <Outlet>)
 *   /bookings/:cabinSlug/itinerary     BookingItinerary      (level 2 sibling)
 *   /bookings/:cabinSlug/guests        GuestsLayout          (level 2 sibling, itself a layout)
 *   /bookings/:cabinSlug/guests/:id    GuestDetail            (level 3 — a child of a child)
 *
 * Every route's own element is wrapped in its own <RouteErrorBoundary> —
 * see apps/dining-mfe/src/DiningApp.tsx for why the per-route `key`s are
 * required (not decorative) and why static per-route strings are enough
 * given every path into a nested screen goes through the index route first.
 */
export function BookingsApp() {
  return (
    <Routes>
      <Route
        index
        element={
          <RouteErrorBoundary key="index" id="bookings:index" label="Bookings home">
            <BookingsList />
          </RouteErrorBoundary>
        }
      />
      <Route
        path=":cabinSlug"
        element={
          <RouteErrorBoundary key="detail" id="bookings:detail" label="Booking details">
            <BookingDetail />
          </RouteErrorBoundary>
        }
      >
        <Route
          index
          element={
            <RouteErrorBoundary key="overview" id="bookings:overview" label="Booking overview">
              <BookingOverview />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="itinerary"
          element={
            <RouteErrorBoundary key="itinerary" id="bookings:itinerary" label="Itinerary">
              <BookingItinerary />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="guests"
          element={
            <RouteErrorBoundary key="guests-layout" id="bookings:guests-layout" label="Guests">
              <GuestsLayout />
            </RouteErrorBoundary>
          }
        >
          <Route
            index
            element={
              <RouteErrorBoundary key="guests-index" id="bookings:guests-index" label="Guests">
                <GuestsList />
              </RouteErrorBoundary>
            }
          />
          <Route
            path=":guestId"
            element={
              <RouteErrorBoundary key="guest-detail" id="bookings:guest-detail" label="Guest details">
                <GuestDetail />
              </RouteErrorBoundary>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default BookingsApp;
