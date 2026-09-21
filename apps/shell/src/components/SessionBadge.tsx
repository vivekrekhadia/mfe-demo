import { useEffect, useState } from "react";
import { MOCK_SESSION_PATH } from "@mfe/shared-config";
import { Badge } from "@mfe/design-system";

interface Session {
  user: string;
  authenticatedVia: string;
}

/**
 * Deliberately trivial: a real ship-local identity provider is a separate
 * architectural concern from MFE delivery (see README "Authentication").
 * This only proves the point that *some* session data can be served
 * entirely from the Ship Server, with no cloud round-trip, so the Shell
 * never blocks on connectivity it doesn't have.
 */
export function SessionBadge() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(MOCK_SESSION_PATH)
      .then((res) => res.json())
      .then((data: Session) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session) return null;

  return (
    <Badge title={`Authenticated via ${session.authenticatedVia}`}>
      {session.user}
    </Badge>
  );
}
