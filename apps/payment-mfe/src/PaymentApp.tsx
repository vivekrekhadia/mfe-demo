import { Route, Routes } from "react-router-dom";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("payment/PaymentApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";
import { RouteErrorBoundary } from "@mfe/design-system";
import { InvoicesList } from "./InvoicesList";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceSummary } from "./InvoiceSummary";
import { LineItemsLayout } from "./LineItemsLayout";
import { LineItemsList } from "./LineItemsList";
import { LineItemDetail } from "./LineItemDetail";

/**
 * Mounted by the Shell at "/payments/*" — same pattern as Bookings and
 * Dining (see apps/bookings-mfe/src/BookingsApp.tsx for the full
 * explanation). Three levels deep here too:
 *
 *   /payments                        InvoicesList     (level 1)
 *   /payments/:invoiceId             InvoiceDetail      (level 2 layout, Summary tab is its index)
 *   /payments/:invoiceId/items       LineItemsLayout     (level 2 sibling, itself a layout)
 *   /payments/:invoiceId/items/:id   LineItemDetail        (level 3 — a child of a child)
 *
 * Every route's own element is wrapped in its own <RouteErrorBoundary> —
 * see apps/dining-mfe/src/DiningApp.tsx for why the per-route `key`s are
 * required (not decorative) and why static per-route strings are enough
 * given every path into a nested screen goes through the index route first.
 */
export function PaymentApp() {
  return (
    <Routes>
      <Route
        index
        element={
          <RouteErrorBoundary key="index" id="payment:index" label="Payments home">
            <InvoicesList />
          </RouteErrorBoundary>
        }
      />
      <Route
        path=":invoiceId"
        element={
          <RouteErrorBoundary key="detail" id="payment:detail" label="Invoice details">
            <InvoiceDetail />
          </RouteErrorBoundary>
        }
      >
        <Route
          index
          element={
            <RouteErrorBoundary key="summary" id="payment:summary" label="Invoice summary">
              <InvoiceSummary />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="items"
          element={
            <RouteErrorBoundary key="items-layout" id="payment:items-layout" label="Line items">
              <LineItemsLayout />
            </RouteErrorBoundary>
          }
        >
          <Route
            index
            element={
              <RouteErrorBoundary key="items-index" id="payment:items-index" label="Line items">
                <LineItemsList />
              </RouteErrorBoundary>
            }
          />
          <Route
            path=":itemId"
            element={
              <RouteErrorBoundary key="item-detail" id="payment:item-detail" label="Line item details">
                <LineItemDetail />
              </RouteErrorBoundary>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default PaymentApp;
