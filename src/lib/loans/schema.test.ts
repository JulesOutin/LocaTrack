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

  // FormData.get() renvoie null (pas "" ni undefined) pour un champ que le
  // formulaire n'a pas rendu — ex. le champ masqué par le bascule
  // "emprunteur existant" / "nouvel emprunteur" du formulaire de prêt.
  it("accepts an existing borrower when newBorrowerName is absent from the form (null)", () => {
    const result = createLoanInputSchema.safeParse({
      assetId: uuid,
      borrowerId: uuid,
      newBorrowerName: null,
      dueAt: "2026-03-01",
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a quick-created borrower when borrowerId is absent from the form (null)", () => {
    const result = createLoanInputSchema.safeParse({
      assetId: uuid,
      borrowerId: null,
      newBorrowerName: "Camille Durand",
      dueAt: "2026-03-01",
      notes: null,
    });
    expect(result.success).toBe(true);
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
