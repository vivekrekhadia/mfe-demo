import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { Icon, HelperNote } from "@mfe/design-system";
import { findInvoiceById } from "./payments";

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? "mfe-tab mfe-tab-active" : "mfe-tab");

/**
 * Layout for "/payments/:invoiceId". Renders the invoice's own sub-nav
 * (Summary / Line Items) and an <Outlet /> for whichever child route
 * currently matches, passing the resolved invoice down via route context
 * so children don't need to re-look it up by id.
 */
export function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const invoice = invoiceId ? findInvoiceById(invoiceId) : undefined;

  return (
    <section className="mfe-panel">
      <h2>Payments</h2>
      <Link to="/payments" className="mfe-back-link">
        <Icon name="chevron-left" size={14} />
        Back to payments
      </Link>

      {invoice ? (
        <>
          <h3>{invoice.label}</h3>
          <HelperNote>
            Route: <code>/payments/{invoiceId}</code> — a layout, not a leaf: it renders the tabs
            below and an <code>&lt;Outlet&gt;</code> for whichever child route currently matches
            (Summary, Line Items). Both are routes this MFE owns entirely — the Shell's own route
            config only ever says <code>/payments/*</code>.
          </HelperNote>
          <nav className="mfe-subnav">
            <NavLink end to="." className={tabClass}>
              Summary
            </NavLink>
            <NavLink to="items" className={tabClass}>
              Line Items
            </NavLink>
          </nav>
          <Outlet context={invoice} />
        </>
      ) : (
        <p className="mfe-detail">No invoice found for "{invoiceId}".</p>
      )}
    </section>
  );
}
