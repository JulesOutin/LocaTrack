import { describe, expect, it } from "vitest";
import {
  publicLoanRequestInputSchema,
  reviewLoanRequestInputSchema,
} from "@/lib/loan-requests/schema";

describe("publicLoanRequestInputSchema", () => {
  it("accepts a minimal valid public request", () => {
    const result = publicLoanRequestInputSchema.safeParse({
      qrToken: "abc123",
      requesterName: "Camille Durand",
      requesterEmail: "",
      requestedDueAt: "2026-03-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requesterEmail).toBeNull();
    }
  });

  it("rejects a missing name or due date", () => {
    expect(
      publicLoanRequestInputSchema.safeParse({
        qrToken: "abc123",
        requesterName: "",
        requesterEmail: "",
        requestedDueAt: "2026-03-01",
      }).success,
    ).toBe(false);

    expect(
      publicLoanRequestInputSchema.safeParse({
        qrToken: "abc123",
        requesterName: "Camille Durand",
        requesterEmail: "",
        requestedDueAt: "",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid email when provided", () => {
    const result = publicLoanRequestInputSchema.safeParse({
      qrToken: "abc123",
      requesterName: "Camille Durand",
      requesterEmail: "not-an-email",
      requestedDueAt: "2026-03-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewLoanRequestInputSchema", () => {
  // Le formulaire d'approbation n'a pas de champ reviewNote : FormData.get()
  // renvoie null, pas une chaîne vide.
  it("accepts an approval with no reviewNote field at all (null)", () => {
    const result = reviewLoanRequestInputSchema.safeParse({
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      reviewNote: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviewNote).toBeNull();
    }
  });
});
