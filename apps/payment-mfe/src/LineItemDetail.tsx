import { Link, useOutletContext, useParams } from "react-router-dom";
import { Icon } from "@mfe/design-system";
import type { Invoice } from "./payments";

/**
 * "/payments/:invoiceId/items/:itemId" — a child of LineItemsLayout, which
 * is itself a child of InvoiceDetail: three <Route> levels deep, all
 * within this one MFE, all still under the Shell's single "/payments/*"
 * mount point.
 */
export function LineItemDetail() {
  const invoice = useOutletContext<Invoice>();
  const { itemId } = useParams<{ itemId: string }>();
  const item = invoice.items.find((i) => i.id === itemId);

  return (
    <div>
      <Link to=".." className="mfe-back-link">
        <Icon name="chevron-left" size={14} />
        Back to line items
      </Link>
      {item ? (
        <div className="mfe-row">
          <div className="mfe-row-title">{item.label}</div>
          <p className="mfe-amount">{item.amount}</p>
          <p className="mfe-detail">Charged to invoice {invoice.label}.</p>
        </div>
      ) : (
        <p className="mfe-detail">No line item found with id "{itemId}".</p>
      )}
    </div>
  );
}
