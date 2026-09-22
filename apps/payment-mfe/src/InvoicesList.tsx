import { Link } from "react-router-dom";
import { Badge, Button, HelperNote } from "@mfe/design-system";
import { invoices } from "./payments";

/** "/payments" (index) — links to "/payments/:invoiceId", a real URL, not local state. */
export function InvoicesList() {
  return (
    <section className="mfe-panel">
      <h2>Payments</h2>

      <HelperNote>
        Route: <code>/payments</code> (index) — this whole screen is the <code>payment</code>{" "}
        remote's own <code>InvoicesList</code> component, loaded on demand via{" "}
        <code>import("payment/PaymentApp")</code>, never bundled into the Shell (see
        apps/shell/src/federation/remoteImports.ts).
      </HelperNote>

      <h3>Recent invoices</h3>
      {invoices.map((inv) => (
        <div key={inv.id} className="mfe-row">
          <div className="pm:flex pm:items-center pm:gap-2">
            <div className="mfe-row-title">{inv.label}</div>
            <Badge tone="success">Paid</Badge>
          </div>
          <div>{inv.date}</div>
          <p className="mfe-amount">{inv.amount}</p>
          <div className="pm:flex pm:items-center pm:gap-2">
            <Link to={inv.id}>
              <Button>View Invoice</Button>
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
