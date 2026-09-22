export interface LineItem {
  id: string;
  label: string;
  amount: string;
}

export interface Invoice {
  id: string;
  label: string;
  amount: string;
  date: string;
  items: LineItem[];
}

// In-memory demo data. A real implementation would fetch this from an API;
// nothing about the sub-routing below depends on where it comes from.
export const invoices: Invoice[] = [
  {
    id: "inv-001",
    label: "September folio",
    amount: "$245.50",
    date: "18 Sep",
    items: [
      { id: "li-1", label: "Dining - Ocean Restaurant", amount: "$85.00" },
      { id: "li-2", label: "Spa treatment", amount: "$120.50" },
      { id: "li-3", label: "Wifi package", amount: "$40.00" },
    ],
  },
  {
    id: "inv-002",
    label: "August folio",
    amount: "$100.00",
    date: "20 Aug",
    items: [{ id: "li-4", label: "Shore excursion deposit", amount: "$100.00" }],
  },
];

export function findInvoiceById(id: string): Invoice | undefined {
  return invoices.find((inv) => inv.id === id);
}
