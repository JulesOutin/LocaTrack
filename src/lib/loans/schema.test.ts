import { describe, expect, it } from "vitest";
import { createLoanInputSchema, returnLoanInputSchema } from "@/lib/loans/schema";

const uuid = "123e4567-e89b-12d3-a456-426614174000";

describe("createLoanInputSchema", () => {
  it("accepts an existing borrower", () => {
    const result = createLoanInputSchema.safeParse({
      assetId: uuid,
      borrowerId: uuid,
      newBorrowerName: "",
      dueAt: "2026-03-01",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a quick-created borrower name instead", () => {
    const result = createLoanInputSchema.safeParse({
      assetId: uuid,
      borrowerId: "",
      newBorrowerName: "Camille Durand",
      dueAt: "2026-03-01",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neither a borrower nor a new name is provided", () => {
    const result = createLoanInputSchema.safeParse({
      assetId: uuid,
      borrowerId: "",
      newBorrowerName: "",
      dueAt: "2026-03-01",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("returnLoanInputSchema", () => {
  it("accepts a good-condition return to available", () => {
    const result = returnLoanInputSchema.safeParse({
      loanId: uuid,
      condition: "good",
      nextStatus: "available",
      incidentNote: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid nextStatus value", () => {
    const result = returnLoanInputSchema.safeParse({
      loanId: uuid,
      condition: "good",
      nextStatus: "archived",
      incidentNote: "",
    });
    expect(result.success).toBe(false);
  });
});
