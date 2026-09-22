import { useOutletContext } from "react-router-dom";
import type { Invoice } from "./payments";

/** "/payments/:invoiceId" (index) — the default tab of InvoiceDetail's layout. */
export function InvoiceSummary() {
  const invoice = useOutletContext<Invoice>();

  return (
    <div className="mfe-row">
      <div>Billed {invoice.date}</div>
      <p className="mfe-amount">{invoice.amount}</p>
      <p className="mfe-detail">{invoice.items.length} line item(s) on this invoice.</p>
    </div>
  );
}
