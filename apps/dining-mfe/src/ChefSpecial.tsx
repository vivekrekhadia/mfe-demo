import { useShellState } from "@mfe/shared-state";
import { Badge, Button } from "@mfe/design-system";

interface ChefSpecialProps {
  restaurantName: string;
  dish: string;
  price: string;
}

/**
 * A real, working feature — not filler for the crash demo it sits next to
 * (see RestaurantsList.tsx/Menu.tsx). Writes to the same cross-app shared
 * state Bookings' "Notify crew" button does (see
 * apps/bookings-mfe/src/BookingsList.tsx) — Dining didn't have its own
 * example of that pattern yet. Deliberately placed inside the same
 * RouteErrorBoundary as CrashDemo: when that section is broken, this is
 * the actual functionality that goes down with it, not just an inert
 * button with nothing behind it.
 */
export function ChefSpecial({ restaurantName, dish, price }: ChefSpecialProps) {
  const shellState = useShellState();

  return (
    <div className="mfe-row">
      <div className="dn:flex dn:items-center dn:gap-2">
        <div className="mfe-row-title">Chef's special: {dish}</div>
        <Badge tone="accent">{price}</Badge>
      </div>
      <div>Recommended by the galley today at {restaurantName}.</div>
      {shellState && (
        <div className="dn:mt-2">
          <Button
            variant="secondary"
            onClick={() => shellState.notify(`Chef's special requested at ${restaurantName}`)}
          >
            Notify galley
          </Button>
        </div>
      )}
    </div>
  );
}
