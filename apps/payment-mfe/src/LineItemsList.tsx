import { Link, useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Invoice } from "./payments";

/** "/payments/:invoiceId/items" (index) — one level below LineItemsLayout. */
export function LineItemsList() {
  const invoice = useOutletContext<Invoice>();

  return (
    <div>
      <HelperNote>
        Route: <code>/payments/:invoiceId/items</code> (index). This and its sibling{" "}
        <code>/items/:itemId</code> are a third level of nested <code>&lt;Route&gt;</code> — a
        child of a child — still entirely inside this one MFE. LineItemsLayout.tsx (the parent
        route) renders no UI of its own, only an <code>&lt;Outlet&gt;</code>.
      </HelperNote>
      <p className="mfe-note">Line items for {invoice.label}</p>
      {invoice.items.map((item) => (
        <div key={item.id} className="mfe-row">
          <div className="mfe-row-title">{item.label}</div>
          <div>{item.amount}</div>
          <div className="pm:mt-1">
            <Link to={item.id}>View item &rarr;</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
