import "server-only";
import { and, eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { assetEvents, assets, borrowers, loanEvents, loanRequests, loans } from "@/db/schema";
import { generateSecureToken } from "@/lib/tokens";
import { AssetNotLoanableError } from "@/lib/loans/mutations";

export class AssetNotRequestableError extends Error {
  constructor() {
    super("Cet objet ne peut pas faire l'objet d'une demande pour le moment.");
    this.name = "AssetNotRequestableError";
  }
}

export class RequestNotPendingError extends Error {
  constructor(message = "Cette demande a déjà été traitée.") {
    super(message);
    this.name = "RequestNotPendingError";
  }
}

export class LoanRequestsDisabledError extends Error {
  constructor() {
    super("Les demandes autonomes sont désactivées pour cette organisation.");
    this.name = "LoanRequestsDisabledError";
  }
}

type LoanRequestRow = typeof loanRequests.$inferSelect;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = PgTransaction<any, any, any>;

/**
 * Cœur de l'approbation : revérifie la disponibilité de l'objet dans la
 * transaction courante et crée le prêt dans le même mouvement. Si l'objet
 * n'est plus disponible, l'appelant reste dans une transaction saine (aucune
 * commande SQL en échec n'a encore été émise) et peut décider quoi faire.
 */
async function performApproval(
  tx: Tx,
  organizationId: string,
  request: LoanRequestRow,
  actorUserId: string | null,
) {
  const [asset] = await tx
    .select()
    .from(assets)
    .where(and(eq(assets.organizationId, organizationId), eq(assets.id, request.assetId)))
    .for("update");

  if (!asset || asset.status !== "available") {
    throw new AssetNotLoanableError();
  }

  let borrowerId = request.borrowerId;
  if (!borrowerId) {
    const [borrower] = await tx
      .insert(borrowers)
      .values({
        organizationId,
        displayName: request.requesterName,
        email: request.requesterEmail,
      })
      .returning();
    borrowerId = borrower.id;
  }

  const [loan] = await tx
    .insert(loans)
    .values({
      organizationId,
      assetId: asset.id,
      borrowerId,
      issuedBy: actorUserId,
      dueAt: request.requestedDueAt,
      notes: `Créé depuis la demande de ${request.requesterName}.`,
      status: "active",
    })
    .returning();

  await tx
    .update(assets)
    .set({ status: "unavailable", updatedAt: new Date() })
    .where(eq(assets.id, asset.id));

  await tx
    .update(loanRequests)
    .set({
      status: "approved",
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(loanRequests.id, request.id));

  await tx.insert(loanEvents).values({
    organizationId,
    loanId: loan.id,
    actorUserId,
    eventType: "loan_created",
    metadata: { loanRequestId: request.id },
  });

  await tx.insert(assetEvents).values({
    organizationId,
    assetId: asset.id,
    actorUserId,
    eventType: "loan_request_approved",
    metadata: { loanRequestId: request.id },
  });

  return loan;
}

export type CreateLoanRequestInput = {
  requesterName: string;
  requesterEmail: string | null;
  requestedDueAt: Date;
};

export async function createLoanRequest(
  organizationId: string,
  assetId: string,
  input: CreateLoanRequestInput,
  autoApprove: boolean,
) {
  const request = await db.transaction(async (tx) => {
    const [asset] = await tx
      .select({ status: assets.status })
      .from(assets)
      .where(and(eq(assets.organizationId, organizationId), eq(assets.id, assetId)))
      .limit(1);

    if (!asset || asset.status === "archived" || asset.status === "maintenance") {
      throw new AssetNotRequestableError();
    }

    const [created] = await tx
      .insert(loanRequests)
      .values({
        organizationId,
        assetId,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail,
        requestedDueAt: input.requestedDueAt,
        status: "pending",
        trackingToken: generateSecureToken(),
      })
      .returning();

    await tx.insert(assetEvents).values({
      organizationId,
      assetId,
      actorUserId: null,
      eventType: "loan_request_created",
      metadata: { loanRequestId: created.id },
    });

    return created;
  });

  if (autoApprove) {
    // Transaction indépendante et volontairement non bloquante : si
    // l'approbation automatique échoue (objet devenu indisponible entre
    // deux instants), la demande créée ci-dessus reste valide et en
    // attente — elle n'est jamais perdue ni dans un état incohérent.
    try {
      await approveLoanRequest(organizationId, request.id, null);
    } catch {
      // Reste "pending" ; un gestionnaire pourra statuer manuellement.
    }
  }

  return request;
}

export async function approveLoanRequest(
  organizationId: string,
  requestId: string,
  actorUserId: string | null,
) {
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(loanRequests)
      .where(and(eq(loanRequests.organizationId, organizationId), eq(loanRequests.id, requestId)))
      .for("update");

    if (!request) throw new Error("Demande introuvable.");
    if (request.status !== "pending") throw new RequestNotPendingError();

    return performApproval(tx, organizationId, request, actorUserId);
  });
}

export async function rejectLoanRequest(
  organizationId: string,
  requestId: string,
  actorUserId: string,
  reviewNote: string | null,
) {
  const [request] = await db
    .update(loanRequests)
    .set({
      status: "rejected",
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
      reviewNote,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(loanRequests.organizationId, organizationId),
        eq(loanRequests.id, requestId),
        eq(loanRequests.status, "pending"),
      ),
    )
    .returning();

  if (!request) throw new RequestNotPendingError();

  await db.insert(assetEvents).values({
    organizationId,
    assetId: request.assetId,
    actorUserId,
    eventType: "loan_request_rejected",
    notes: reviewNote,
    metadata: { loanRequestId: request.id },
  });

  return request;
}

/** Annulation publique (page de suivi) : identifiée uniquement par le jeton de suivi. */
export async function cancelLoanRequestByTrackingToken(trackingToken: string) {
  const [request] = await db
    .update(loanRequests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(loanRequests.trackingToken, trackingToken), eq(loanRequests.status, "pending")))
    .returning();

  if (!request) throw new RequestNotPendingError();

  await db.insert(assetEvents).values({
    organizationId: request.organizationId,
    assetId: request.assetId,
    actorUserId: null,
    eventType: "loan_request_cancelled",
    metadata: { loanRequestId: request.id },
  });

  return request;
}
