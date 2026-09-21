import { Button } from "@mfe/design-system";

export function PaymentApp() {
  return (
    <section className="mfe-panel">
      <h2>Payments</h2>
      <h3>Current balance</h3>
      <p className="mfe-amount">$245.50</p>
      <h3>Last payment</h3>
      <p>$100.00</p>
      <Button>View Payments</Button>
    </section>
  );
}

export default PaymentApp;
