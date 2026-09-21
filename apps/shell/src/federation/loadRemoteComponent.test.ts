import { describe, expect, it } from "vitest";
import { loadRemoteComponent } from "./loadRemoteComponent";

function Placeholder() {
  return null;
}

describe("loadRemoteComponent", () => {
  it("resolves with the exposed component when the remote loads", async () => {
    const result = await loadRemoteComponent(async () => ({ default: Placeholder }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.Component).toBe(Placeholder);
  });

  it("catches a failed remote load (e.g. remoteEntry.js unreachable) instead of throwing", async () => {
    const result = await loadRemoteComponent(async () => {
      throw new Error("Failed to fetch dynamically imported module: bookings/BookingsApp");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/BookingsApp/);
  });
});
