import { useOutletContext } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";
import type { Invoice } from "./payments";

/** "/payments/:invoiceId" (index) — the default tab of InvoiceDetail's layout. */
export function InvoiceSummary() {
  const invoice = useOutletContext<Invoice>();

  return (
    <div className="mfe-row">
      <HelperNote>
        This is the <strong>index route</strong> of <code>/payments/:invoiceId</code> — no path
        segment of its own, rendered by default when <code>items</code> isn't present. A sibling{" "}
        <code>&lt;Route index&gt;</code> to it.
      </HelperNote>
      <div>Billed {invoice.date}</div>
      <p className="mfe-amount">{invoice.amount}</p>
      <p className="mfe-detail">{invoice.items.length} line item(s) on this invoice.</p>
    </div>
  );
}
