import { Button } from "@mfe/design-system";
// Imported here (the exposed Module Federation module), not in
// bootstrap.tsx: bootstrap.tsx is only used for this MFE's standalone dev
// mode and is never part of what the Shell actually loads at runtime — the
// Shell only pulls in this file's own import graph via
// import("dining/DiningApp"). Preflight/theme (@mfe/design-system's
// tailwind.css) is NOT imported here — the Shell owns that one global copy.
import "./tailwind.css";

interface Restaurant {
  name: string;
  hours: string;
}

const restaurants: Restaurant[] = [
  { name: "Ocean Restaurant", hours: "18:00 - 22:00" },
  { name: "Seafood Grill", hours: "19:00 - 23:00" },
];

export function DiningApp() {
  return (
    <section className="mfe-panel">
      <h2>Dining</h2>
      <h3>Today's restaurants</h3>
      {restaurants.map((r) => (
        <div key={r.name} className="mfe-row">
          <div className="mfe-row-title">{r.name}</div>
          <div>Open {r.hours}</div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button>View Restaurants</Button>
        <span className="rounded-ds-pill bg-ds-navy px-3 py-1 text-xs text-white">Tailwind-styled tag</span>
      </div>
    </section>
  );
}

export default DiningApp;
