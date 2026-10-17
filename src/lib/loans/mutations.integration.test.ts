import { describe, expect, it } from "vitest";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { assets, loans } from "@/db/schema";
import {
  AssetAlreadyLoanedError,
  AssetNotLoanableError,
  createLoan,
  returnLoan,
} from "@/lib/loans/mutations";
import { archiveAsset, AssetHasActiveLoanError } from "@/lib/assets/mutations";
import { getAssetById } from "@/lib/assets/queries";
import { getLoanById, listLoans } from "@/lib/loans/queries";
import {
  createTestAsset,
  createTestBorrower,
  createTestOrganization,
  futureDate,
} from "@/test-support/factories";

describe("création d'un prêt", () => {
  it("crée le prêt et rend l'objet immédiatement indisponible", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);
    const borrower = await createTestBorrower(org.id);

    const loan = await createLoan({
      organizationId: org.id,
      actorUserId: "user-1",
      assetId: asset.id,
      borrowerId: borrower.id,
      newBorrowerName: null,
      dueAt: futureDate(7),
      notes: null,
    });

    expect(loan.status).toBe("active");

    const updatedAsset = await getAssetById(org.id, asset.id);
    expect(updatedAsset?.status).toBe("unavailable");
  });

  it("refuse de prêter un objet déjà indisponible", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id, { status: "maintenance" });
    const borrower = await createTestBorrower(org.id);

    await expect(
      createLoan({
        organizationId: org.id,
        actorUserId: "user-1",
        assetId: asset.id,
        borrowerId: borrower.id,
        newBorrowerName: null,
        dueAt: futureDate(7),
        notes: null,
      }),
    ).rejects.toThrow(AssetNotLoanableError);
  });
});

describe("double emprunt concurrent", () => {
  it("une seule des deux tentatives simultanées sur le même objet réussit", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);
    const borrowerX = await createTestBorrower(org.id, { displayName: "Emprunteur X" });
    const borrowerY = await createTestBorrower(org.id, { displayName: "Emprunteur Y" });

    const attempt = (borrowerId: string) =>
      createLoan({
        organizationId: org.id,
        actorUserId: "user-1",
        assetId: asset.id,
        borrowerId,
        newBorrowerName: null,
        dueAt: futureDate(7),
        notes: null,
      });

    const results = await Promise.allSettled([attempt(borrowerX.id), attempt(borrowerY.id)]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    // Le verrou FOR UPDATE sérialise déjà les deux tentatives : la seconde
    // relit un objet "unavailable" et échoue via la vérification normale de
    // disponibilité (AssetNotLoanableError). L'index unique partiel
    // (AssetAlreadyLoanedError) est le filet de sécurité si jamais ce verrou
    // ne suffisait pas — les deux issues prouvent qu'un seul prêt est créé.
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(
      reason instanceof AssetAlreadyLoanedError || reason instanceof AssetNotLoanableError,
    ).toBe(true);

    const activeLoans = await db
      .select()
      .from(loans)
      .where(and(eq(loans.organizationId, org.id), eq(loans.assetId, asset.id), eq(loans.status, "active")));
    expect(activeLoans).toHaveLength(1);
  });
});

describe("retour d'un matériel endommagé", () => {
  it("empêche le retour automatique à disponible et journalise l'état constaté", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);
    const borrower = await createTestBorrower(org.id);

    const loan = await createLoan({
      organizationId: org.id,
      actorUserId: "user-1",
      assetId: asset.id,
      borrowerId: borrower.id,
      newBorrowerName: null,
      dueAt: futureDate(7),
      notes: null,
    });

    await returnLoan({
      organizationId: org.id,
      loanId: loan.id,
      actorUserId: "user-1",
      condition: "damaged",
      // Le client demande "available" ; la règle métier doit l'empêcher.
      nextStatus: "available",
      incidentNote: "Écran cassé",
    });

    const returnedLoan = await getLoanById(org.id, loan.id);
    expect(returnedLoan?.status).toBe("returned");

    const updatedAsset = await getAssetById(org.id, asset.id);
    expect(updatedAsset?.status).toBe("maintenance");
    expect(updatedAsset?.condition).toBe("damaged");
  });
});

describe("calcul des retards", () => {
  it("marque un prêt actif comme en retard uniquement si la date est dépassée", async () => {
    const org = await createTestOrganization();
    const overdueAsset = await createTestAsset(org.id);
    const onTimeAsset = await createTestAsset(org.id);
    const borrower = await createTestBorrower(org.id);

    const overdueLoan = await createLoan({
      organizationId: org.id,
      actorUserId: "user-1",
      assetId: overdueAsset.id,
      borrowerId: borrower.id,
      newBorrowerName: null,
      dueAt: futureDate(-1),
      notes: null,
    });

    await createLoan({
      organizationId: org.id,
      actorUserId: "user-1",
      assetId: onTimeAsset.id,
      borrowerId: borrower.id,
      newBorrowerName: null,
      dueAt: futureDate(7),
      notes: null,
    });

    const overdueResult = await getLoanById(org.id, overdueLoan.id);
    expect(overdueResult?.isOverdue).toBe(true);

    const { loans: overdueList } = await listLoans(org.id, { status: "overdue" });
    expect(overdueList.map((l) => l.id)).toContain(overdueLoan.id);
    expect(overdueList.every((l) => l.isOverdue)).toBe(true);
  });
});

describe("archivage d'un objet", () => {
  it("refuse d'archiver un objet ayant un prêt actif", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);
    const borrower = await createTestBorrower(org.id);

    await createLoan({
      organizationId: org.id,
      actorUserId: "user-1",
      assetId: asset.id,
      borrowerId: borrower.id,
      newBorrowerName: null,
      dueAt: futureDate(7),
      notes: null,
    });

    await expect(archiveAsset(org.id, asset.id, "user-1")).rejects.toThrow(
      AssetHasActiveLoanError,
    );
  });

  it("autorise l'archivage une fois l'objet sans prêt actif", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id);

    const archived = await archiveAsset(org.id, asset.id, "user-1");
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).not.toBeNull();

    const row = await db.select().from(assets).where(eq(assets.id, asset.id));
    expect(row[0].status).toBe("archived");
  });
});
