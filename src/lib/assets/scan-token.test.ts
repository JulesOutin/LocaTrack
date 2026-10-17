import { describe, expect, it } from "vitest";
import { extractTokenFromScan } from "@/lib/assets/scan-token";

describe("extractTokenFromScan", () => {
  it("extracts the token from a full scanned URL", () => {
    expect(extractTokenFromScan("https://locatrack.app/q/abc123")).toBe("abc123");
  });

  it("strips trailing query strings and slashes", () => {
    expect(extractTokenFromScan("https://locatrack.app/q/abc123?ref=print")).toBe("abc123");
    expect(extractTokenFromScan("https://locatrack.app/q/abc123/")).toBe("abc123");
  });

  it("returns the raw input unchanged when it isn't a QR URL", () => {
    expect(extractTokenFromScan("INFO-001")).toBe("INFO-001");
  });

  it("trims whitespace from manual input", () => {
    expect(extractTokenFromScan("  INFO-001  ")).toBe("INFO-001");
  });
});
