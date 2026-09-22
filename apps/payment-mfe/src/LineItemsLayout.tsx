import { Outlet, useOutletContext } from "react-router-dom";
import type { Invoice } from "./payments";

/**
 * "/payments/:invoiceId/items" — itself a layout, not a leaf: it
 * re-exposes the invoice it received from InvoiceDetail's <Outlet> to its
 * own children (LineItemsList, LineItemDetail). This is what makes "items"
 * a genuine third level of route nesting — LineItemDetail is a child of a
 * child.
 */
export function LineItemsLayout() {
  const invoice = useOutletContext<Invoice>();
  return <Outlet context={invoice} />;
}
