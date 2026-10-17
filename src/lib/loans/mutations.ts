import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assetEvents, assets, loanEvents, loans } from "@/db/schema";
import { createQuickBorrower } from "@/lib/borrowers/mutations";
import { isUniqueViolation } from "@/lib/db-errors";
import type { AssetCondition, AssetStatus } from "@/lib/assets/schema";

export class AssetNotLoanableError extends Error {
  constructor() {
    super("Cet objet n'est pas disponible pour un prêt.");
    this.name = "AssetNotLoanableError";
  }
}

export class AssetAlreadyLoanedError extends Error {
  constructor() {
    super("Cet objet vient d'être emprunté par une autre opération.");
    this.name = "AssetAlreadyLoanedError";
  }
}

export class LoanNotActiveError extends Error {
  constructor(message = "Cette opération ne peut être effectuée que sur un prêt en cours.") {
    super(message);
    this.name = "LoanNotActiveError";
  }
}

export type CreateLoanParams = {
  organizationId: string;
  actorUserId: string;
  assetId: string;
  borrowerId: string | null;
  newBorrowerName: string | null;
  dueAt: Date;
  notes: string | null;
};

export async function createLoan(params: CreateLoanParams) {
  const { organizationId, actorUserId, assetId, dueAt, notes } = params;

  return db.transaction(async (tx) => {
    // Verrouille la ligne de l'objet pour sérialiser les tentatives de prêt
    // concurrentes sur le même objet (défense en profondeur, en plus de
    // l'index unique partiel sur loans.asset_id).
    const [asset] = await tx
      .select()
      .from(assets)
      .where(and(eq(assets.organizationId, organizationId), eq(assets.id, assetId)))
      .for("update");

    if (!asset) {
      throw new Error("Objet introuvable.");
    }
    if (asset.status !== "available") {
      throw new AssetNotLoanableError();
    }

    const borrowerId = params.borrowerId
      ? params.borrowerId
      : (await createQuickBorrower(organizationId, params.newBorrowerName!)).id;

    try {
      const [loan] = await tx
        .insert(loans)
        .values({
          organizationId,
          assetId,
          borrowerId,
          issuedBy: actorUserId,
          dueAt,
          notes,
          status: "active",
        })
        .returning();

      await tx
        .update(assets)
        .set({ status: "unavailable", updatedAt: new Date() })
        .where(eq(assets.id, assetId));

      await tx.insert(loanEvents).values({
        organizationId,
        loanId: loan.id,
        actorUserId,
        eventType: "loan_created",
        metadata: { assetId, borrowerId },
      });

      return loan;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AssetAlreadyLoanedError();
      }
      throw error;
    }
  });
}

export async function extendLoan(
  organizationId: string,
  loanId: string,
  actorUserId: string,
  newDueAt: Date,
) {
  return db.transaction(async (tx) => {
    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.organizationId, organizationId), eq(loans.id, loanId)))
      .for("update");

    if (!loan) throw new Error("Prêt introuvable.");
    if (loan.status !== "active") {
      throw new LoanNotActiveError("Seul un prêt en cours peut être prolongé.");
    }

    const [updated] = await tx
      .update(loans)
      .set({ dueAt: newDueAt, updatedAt: new Date() })
      .where(eq(loans.id, loanId))
      .returning();

    await tx.insert(loanEvents).values({
      organizationId,
      loanId,
      actorUserId,
      eventType: "loan_extended",
      metadata: { previousDueAt: loan.dueAt.toISOString(), newDueAt: newDueAt.toISOString() },
    });

    return updated;
  });
}

export async function cancelLoan(organizationId: string, loanId: string, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.organizationId, organizationId), eq(loans.id, loanId)))
      .for("update");

    if (!loan) throw new Error("Prêt introuvable.");
    if (loan.status !== "active") {
      throw new LoanNotActiveError("Seul un prêt en cours peut être annulé.");
    }

    await tx
      .update(loans)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(loans.id, loanId));

    await tx
      .update(assets)
      .set({ status: "available", updatedAt: new Date() })
      .where(and(eq(assets.id, loan.assetId), eq(assets.organizationId, organizationId)));

    await tx.insert(loanEvents).values({
      organizationId,
      loanId,
      actorUserId,
      eventType: "loan_cancelled",
      metadata: {},
    });
  });
}

export type ReturnLoanParams = {
  organizationId: string;
  loanId: string;
  actorUserId: string;
  condition: AssetCondition;
  nextStatus: AssetStatus;
  incidentNote: string | null;
};

export async function returnLoan(params: ReturnLoanParams) {
  const { organizationId, loanId, actorUserId, condition, incidentNote } = params;

  return db.transaction(async (tx) => {
    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.organizationId, organizationId), eq(loans.id, loanId)))
      .for("update");

    if (!loan) throw new Error("Prêt introuvable.");
    if (loan.status !== "active") {
      throw new LoanNotActiveError("Seul un prêt en cours peut être retourné.");
    }

    // Un objet constaté endommagé ne peut pas redevenir disponible
    // automatiquement, même si un autre statut a été demandé côté client.
    const nextStatus: AssetStatus =
      condition === "damaged" && params.nextStatus === "available"
        ? "maintenance"
        : params.nextStatus;

    const combinedNotes = incidentNote
      ? loan.notes
        ? `${loan.notes}\n\n[Retour] ${incidentNote}`
        : incidentNote
      : loan.notes;

    await tx
      .update(loans)
      .set({
        status: "returned",
        returnedAt: new Date(),
        checkedInBy: actorUserId,
        notes: combinedNotes,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId));

    await tx
      .update(assets)
      .set({ status: nextStatus, condition, updatedAt: new Date() })
      .where(and(eq(assets.id, loan.assetId), eq(assets.organizationId, organizationId)));

    await tx.insert(loanEvents).values({
      organizationId,
      loanId,
      actorUserId,
      eventType: "loan_returned",
      metadata: { condition, nextStatus, incident: Boolean(incidentNote) },
    });

    await tx.insert(assetEvents).values({
      organizationId,
      assetId: loan.assetId,
      actorUserId,
      eventType: "asset_condition_changed",
      notes: incidentNote,
      metadata: { condition, status: nextStatus },
    });
  });
}
