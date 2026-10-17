import { describe, expect, it } from "vitest";
import { dueDateToUtc } from "@/lib/loans/due-date";

describe("dueDateToUtc", () => {
  it("interprets the date as end of day in the organization's timezone (winter, UTC+1)", () => {
    const result = dueDateToUtc("2026-01-15", "Europe/Paris");
    expect(result.toISOString()).toBe("2026-01-15T22:59:59.000Z");
  });

  it("accounts for daylight saving time (summer, UTC+2)", () => {
    const result = dueDateToUtc("2026-07-15", "Europe/Paris");
    expect(result.toISOString()).toBe("2026-07-15T21:59:59.000Z");
  });

  it("is a no-op shift for UTC", () => {
    const result = dueDateToUtc("2026-03-01", "UTC");
    expect(result.toISOString()).toBe("2026-03-01T23:59:59.000Z");
  });
});
