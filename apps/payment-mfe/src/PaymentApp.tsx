import { Route, Routes } from "react-router-dom";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("payment/PaymentApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";
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
 */
export function PaymentApp() {
  return (
    <Routes>
      <Route index element={<InvoicesList />} />
      <Route path=":invoiceId" element={<InvoiceDetail />}>
        <Route index element={<InvoiceSummary />} />
        <Route path="items" element={<LineItemsLayout />}>
          <Route index element={<LineItemsList />} />
          <Route path=":itemId" element={<LineItemDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default PaymentApp;
