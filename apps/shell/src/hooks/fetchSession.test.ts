import { describe, expect, it } from "vitest";
import { fetchSession } from "./fetchSession";

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as Response) as typeof fetch;
}

describe("fetchSession", () => {
  it("reports authenticated when the Ship Server returns a session", async () => {
    const session = { user: "J. Rivera (Guest 4021)", authenticatedVia: "ship-local-session" };
    const result = await fetchSession(fakeFetch(200, session));
    expect(result).toEqual({ status: "authenticated", session });
  });

  it("reports unauthenticated on a 401 (no or expired session cookie)", async () => {
    const result = await fetchSession(fakeFetch(401, { error: "not authenticated" }));
    expect(result).toEqual({ status: "unauthenticated" });
  });

  it("reports unauthenticated when the network is unreachable (offline / Ship Server down)", async () => {
    const throwingFetch = (async () => {
      throw new Error("network request failed");
    }) as unknown as typeof fetch;
    const result = await fetchSession(throwingFetch);
    expect(result).toEqual({ status: "unauthenticated" });
  });

  it("requests with credentials included so the session cookie is sent", async () => {
    let requestInit: RequestInit | undefined;
    const spyFetch = (async (_url: string, init?: RequestInit) => {
      requestInit = init;
      return { ok: true, status: 200, json: async () => ({ user: "x", authenticatedVia: "y" }) } as Response;
    }) as typeof fetch;
    await fetchSession(spyFetch, "/api/session");
    expect(requestInit?.credentials).toBe("include");
  });
});
