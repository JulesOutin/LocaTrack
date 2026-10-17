import "server-only";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { borrowers, loans, assets } from "@/db/schema";

export const BORROWERS_PAGE_SIZE = 20;

export type BorrowerListFilters = {
  search?: string;
  activeOnly?: boolean;
  page?: number;
};

export async function listBorrowers(organizationId: string, filters: BorrowerListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const conditions = [eq(borrowers.organizationId, organizationId)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(borrowers.displayName, term),
        ilike(borrowers.email, term),
        ilike(borrowers.borrowerCode, term),
      )!,
    );
  }
  if (filters.activeOnly) {
    conditions.push(eq(borrowers.active, true));
  }

  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(borrowers)
      .where(where)
      .orderBy(asc(borrowers.displayName))
      .limit(BORROWERS_PAGE_SIZE)
      .offset((page - 1) * BORROWERS_PAGE_SIZE),
    db.select({ value: count() }).from(borrowers).where(where),
  ]);

  return {
    borrowers: rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / BORROWERS_PAGE_SIZE)),
  };
}

/** Pour la sélection rapide dans le formulaire de prêt : emprunteurs actifs uniquement. */
export async function listActiveBorrowersForSelect(organizationId: string) {
  return db
    .select({ id: borrowers.id, displayName: borrowers.displayName })
    .from(borrowers)
    .where(and(eq(borrowers.organizationId, organizationId), eq(borrowers.active, true)))
    .orderBy(asc(borrowers.displayName))
    .limit(500);
}

export async function getBorrowerById(organizationId: string, borrowerId: string) {
  const [borrower] = await db
    .select()
    .from(borrowers)
    .where(and(eq(borrowers.organizationId, organizationId), eq(borrowers.id, borrowerId)))
    .limit(1);

  return borrower ?? null;
}

export async function getBorrowerLoanHistory(organizationId: string, borrowerId: string) {
  return db
    .select({
      id: loans.id,
      assetName: assets.name,
      loanedAt: loans.loanedAt,
      dueAt: loans.dueAt,
      returnedAt: loans.returnedAt,
      status: loans.status,
    })
    .from(loans)
    .innerJoin(assets, eq(assets.id, loans.assetId))
    .where(and(eq(loans.organizationId, organizationId), eq(loans.borrowerId, borrowerId)))
    .orderBy(desc(loans.loanedAt))
    .limit(50);
}
