import "server-only";
import { and, asc, count, desc, eq, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { assets, borrowers, loanEvents, loans } from "@/db/schema";
import type { LoanStatus } from "@/lib/loans/schema";

export const LOANS_PAGE_SIZE = 20;

export type LoanListFilters = {
  search?: string;
  status?: LoanStatus | "overdue";
  page?: number;
};

function buildLoanWhere(organizationId: string, filters: LoanListFilters) {
  const conditions = [eq(loans.organizationId, organizationId)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(assets.name, term), ilike(borrowers.displayName, term))!);
  }

  if (filters.status === "overdue") {
    conditions.push(eq(loans.status, "active"));
    conditions.push(lte(loans.dueAt, new Date()));
  } else if (filters.status) {
    conditions.push(eq(loans.status, filters.status));
  }

  return and(...conditions);
}

export async function listLoans(organizationId: string, filters: LoanListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildLoanWhere(organizationId, filters);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: loans.id,
        assetId: loans.assetId,
        assetName: assets.name,
        borrowerName: borrowers.displayName,
        loanedAt: loans.loanedAt,
        dueAt: loans.dueAt,
        returnedAt: loans.returnedAt,
        status: loans.status,
      })
      .from(loans)
      .innerJoin(assets, eq(assets.id, loans.assetId))
      .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
      .where(where)
      .orderBy(desc(loans.loanedAt))
      .limit(LOANS_PAGE_SIZE)
      .offset((page - 1) * LOANS_PAGE_SIZE),
    db
      .select({ value: count() })
      .from(loans)
      .innerJoin(assets, eq(assets.id, loans.assetId))
      .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
      .where(where),
  ]);

  const now = Date.now();

  return {
    loans: rows.map((row) => ({
      ...row,
      isOverdue: row.status === "active" && row.dueAt.getTime() < now,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / LOANS_PAGE_SIZE)),
  };
}

/** Export CSV : mêmes filtres que la liste, sans pagination. */
export async function listAllLoansForExport(organizationId: string, filters: LoanListFilters) {
  const where = buildLoanWhere(organizationId, filters);

  const rows = await db
    .select({
      assetName: assets.name,
      assetCode: assets.assetCode,
      borrowerName: borrowers.displayName,
      loanedAt: loans.loanedAt,
      dueAt: loans.dueAt,
      returnedAt: loans.returnedAt,
      status: loans.status,
    })
    .from(loans)
    .innerJoin(assets, eq(assets.id, loans.assetId))
    .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
    .where(where)
    .orderBy(desc(loans.loanedAt));

  const now = Date.now();
  return rows.map((row) => ({
    ...row,
    isOverdue: row.status === "active" && row.dueAt.getTime() < now,
  }));
}

export async function getLoanById(organizationId: string, loanId: string) {
  const [loan] = await db
    .select({
      id: loans.id,
      assetId: loans.assetId,
      assetName: assets.name,
      assetCode: assets.assetCode,
      borrowerId: loans.borrowerId,
      borrowerName: borrowers.displayName,
      issuedBy: loans.issuedBy,
      checkedInBy: loans.checkedInBy,
      loanedAt: loans.loanedAt,
      dueAt: loans.dueAt,
      returnedAt: loans.returnedAt,
      status: loans.status,
      notes: loans.notes,
    })
    .from(loans)
    .innerJoin(assets, eq(assets.id, loans.assetId))
    .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
    .where(and(eq(loans.organizationId, organizationId), eq(loans.id, loanId)))
    .limit(1);

  if (!loan) return null;

  return { ...loan, isOverdue: loan.status === "active" && loan.dueAt.getTime() < Date.now() };
}

export async function getLoanEventHistory(organizationId: string, loanId: string) {
  return db
    .select()
    .from(loanEvents)
    .where(and(eq(loanEvents.organizationId, organizationId), eq(loanEvents.loanId, loanId)))
    .orderBy(desc(loanEvents.createdAt));
}

/** Pour le formulaire de création de prêt : objets réellement disponibles uniquement. */
export async function listAvailableAssetsForSelect(organizationId: string) {
  return db
    .select({ id: assets.id, name: assets.name, assetCode: assets.assetCode })
    .from(assets)
    .where(and(eq(assets.organizationId, organizationId), eq(assets.status, "available")))
    .orderBy(asc(assets.name))
    .limit(500);
}
