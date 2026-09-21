import { Button } from "@mfe/design-system";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("payment/PaymentApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";

export function PaymentApp() {
  return (
    <section className="mfe-panel">
      <h2>Payments</h2>
      <h3>Current balance</h3>
      <p className="mfe-amount">$245.50</p>
      <h3>Last payment</h3>
      <p>$100.00</p>
      <div className="flex items-center gap-2">
        <Button>View Payments</Button>
        <span className="rounded-ds-pill bg-ds-navy px-3 py-1 text-xs text-white">Tailwind-styled tag</span>
      </div>
    </section>
  );
}

export default PaymentApp;
