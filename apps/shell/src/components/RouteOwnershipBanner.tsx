import { useLocation } from "react-router-dom";
import { HelperNote } from "@mfe/design-system";

const OWNERS = [
  { prefix: "/bookings", mfe: "Bookings", remote: "bookings/BookingsApp" },
  { prefix: "/dining", mfe: "Dining", remote: "dining/DiningApp" },
  { prefix: "/payments", mfe: "Payment", remote: "payment/PaymentApp" },
  { prefix: "/signin", mfe: "Sign-In", remote: "signin/SignInApp" },
] as const;

/**
 * Reacts to every navigation (useLocation re-renders on route change) to
 * show, in one place, which independently-deployed MFE owns whatever URL
 * is currently on screen — including sub-routes several levels deep that
 * the Shell's own route config never mentions (see App.tsx: the Shell only
 * ever declares "/bookings/*"). Hidden along with every other <HelperNote>
 * by the "Hide notes" toggle in the header.
 */
export function RouteOwnershipBanner() {
  const location = useLocation();
  const owner = OWNERS.find((o) => location.pathname.startsWith(o.prefix));
  if (!owner) return null;

  return (
    <HelperNote>
      Everything below is owned by the <strong>{owner.mfe} MFE</strong> — loaded at runtime via
      Module Federation from <code>{owner.remote}</code>, built and released independently of this
      Shell. Current path: <code>{location.pathname}</code>.
    </HelperNote>
  );
}
