import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, loanRequests, organizations } from "@/db/schema";
import type { LoanRequestStatus } from "@/lib/loan-requests/schema";

export const LOAN_REQUESTS_PAGE_SIZE = 20;

export type LoanRequestListFilters = {
  status?: LoanRequestStatus;
  page?: number;
};

export async function listLoanRequests(organizationId: string, filters: LoanRequestListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const conditions = [eq(loanRequests.organizationId, organizationId)];
  if (filters.status) {
    conditions.push(eq(loanRequests.status, filters.status));
  }
  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: loanRequests.id,
        assetId: loanRequests.assetId,
        assetName: assets.name,
        assetStatus: assets.status,
        requesterName: loanRequests.requesterName,
        requesterEmail: loanRequests.requesterEmail,
        requestedAt: loanRequests.requestedAt,
        requestedDueAt: loanRequests.requestedDueAt,
        status: loanRequests.status,
        reviewNote: loanRequests.reviewNote,
      })
      .from(loanRequests)
      .innerJoin(assets, eq(assets.id, loanRequests.assetId))
      .where(where)
      .orderBy(desc(loanRequests.requestedAt))
      .limit(LOAN_REQUESTS_PAGE_SIZE)
      .offset((page - 1) * LOAN_REQUESTS_PAGE_SIZE),
    db.select({ value: count() }).from(loanRequests).where(where),
  ]);

  return {
    requests: rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / LOAN_REQUESTS_PAGE_SIZE)),
  };
}

/** Accès public (page de suivi) : identifié uniquement par le jeton de suivi. */
export async function getPublicLoanRequestByTrackingToken(trackingToken: string) {
  const [request] = await db
    .select({
      id: loanRequests.id,
      assetName: assets.name,
      organizationName: organizations.name,
      requesterName: loanRequests.requesterName,
      requestedAt: loanRequests.requestedAt,
      requestedDueAt: loanRequests.requestedDueAt,
      status: loanRequests.status,
      reviewNote: loanRequests.reviewNote,
    })
    .from(loanRequests)
    .innerJoin(assets, eq(assets.id, loanRequests.assetId))
    .innerJoin(organizations, eq(organizations.id, loanRequests.organizationId))
    .where(eq(loanRequests.trackingToken, trackingToken))
    .limit(1);

  return request ?? null;
}
