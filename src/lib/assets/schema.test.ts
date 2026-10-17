import { describe, expect, it } from "vitest";
import { assetInputSchema } from "@/lib/assets/schema";

const baseInput = {
  name: "Ordinateur portable",
  assetCode: "INFO-001",
  categoryId: "",
  serialNumber: "",
  condition: "good",
  status: "available",
  location: "",
  notes: "",
};

describe("assetInputSchema", () => {
  it("accepts a minimal valid asset", () => {
    const result = assetInputSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBeNull();
      expect(result.data.serialNumber).toBeNull();
    }
  });

  it("rejects an empty name or asset code", () => {
    expect(assetInputSchema.safeParse({ ...baseInput, name: "" }).success).toBe(false);
    expect(assetInputSchema.safeParse({ ...baseInput, assetCode: "" }).success).toBe(false);
  });

  it("rejects an invalid condition or status", () => {
    expect(assetInputSchema.safeParse({ ...baseInput, condition: "broken" }).success).toBe(false);
    expect(assetInputSchema.safeParse({ ...baseInput, status: "lost" }).success).toBe(false);
  });

  it("rejects a malformed categoryId", () => {
    expect(assetInputSchema.safeParse({ ...baseInput, categoryId: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("keeps a valid categoryId", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const result = assetInputSchema.safeParse({ ...baseInput, categoryId: uuid });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBe(uuid);
    }
  });
});
