import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, loanRequests } from "@/db/schema";
import {
  approveLoanRequest,
  createLoanRequest,
  rejectLoanRequest,
} from "@/lib/loan-requests/mutations";
import { AssetNotLoanableError } from "@/lib/loans/mutations";
import { getAssetById } from "@/lib/assets/queries";
import { getLoanById } from "@/lib/loans/queries";
import { createTestAsset, createTestOrganization, futureDate } from "@/test-support/factories";

describe("approbation d'une demande", () => {
  it("l'approbation crée réellement le prêt et rend l'objet indisponible", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);

    const request = await createLoanRequest(
      org.id,
      asset.id,
      { requesterName: "Camille Durand", requesterEmail: null, requestedDueAt: futureDate(5) },
      false,
    );

    const loan = await approveLoanRequest(org.id, request.id, "manager-1");

    expect(loan.status).toBe("active");

    const updatedAsset = await getAssetById(org.id, asset.id);
    expect(updatedAsset?.status).toBe("unavailable");

    const persistedLoan = await getLoanById(org.id, loan.id);
    expect(persistedLoan?.borrowerName).toBe("Camille Durand");
  });

  it("refuse d'approuver si l'objet n'est plus disponible, sans créer de prêt invalide", async () => {
    const org = await createTestOrganization();
    // L'objet est disponible au moment de la demande...
    const asset = await createTestAsset(org.id, { status: "available" });

    const request = await createLoanRequest(
      org.id,
      asset.id,
      { requesterName: "Camille Durand", requesterEmail: null, requestedDueAt: futureDate(5) },
      false,
    );

    // ...mais ne l'est plus au moment où un gestionnaire traite la demande
    // (prêté entre-temps par un autre canal, ou mis en maintenance).
    await db.update(assets).set({ status: "maintenance" }).where(eq(assets.id, asset.id));

    await expect(approveLoanRequest(org.id, request.id, "manager-1")).rejects.toThrow(
      AssetNotLoanableError,
    );

    const requestAfter = await db
      .select()
      .from(loanRequests)
      .where(eq(loanRequests.id, request.id));
    expect(requestAfter[0].status).toBe("pending");
  });

  it("une demande déjà traitée ne peut pas être approuvée à nouveau", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);

    const request = await createLoanRequest(
      org.id,
      asset.id,
      { requesterName: "Camille Durand", requesterEmail: null, requestedDueAt: futureDate(5) },
      false,
    );

    await rejectLoanRequest(org.id, request.id, "manager-1", "Objet réservé");

    await expect(approveLoanRequest(org.id, request.id, "manager-1")).rejects.toThrow();
  });
});
