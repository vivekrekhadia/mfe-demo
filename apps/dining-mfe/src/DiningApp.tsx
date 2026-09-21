import { Button } from "@mfe/design-system";

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
      <Button>View Restaurants</Button>
    </section>
  );
}

export default DiningApp;
