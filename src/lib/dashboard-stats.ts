import "server-only";
import { and, count, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  assetEvents,
  assets,
  borrowers,
  loanEvents,
  loanRequests,
  loans,
} from "@/db/schema";

export type UpcomingReturn = {
  loanId: string;
  assetName: string;
  borrowerName: string;
  dueAt: Date;
};

export type RecentActivity = {
  id: string;
  kind: "loan" | "asset";
  eventType: string;
  createdAt: Date;
};

export type DashboardStats = {
  totalAssets: number;
  availableAssets: number;
  borrowedAssets: number;
  lateLoans: number;
  pendingRequests: number;
  upcomingReturns: UpcomingReturn[];
  recentActivity: RecentActivity[];
};

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const now = new Date();

  const [
    [{ value: totalAssets }],
    [{ value: availableAssets }],
    [{ value: borrowedAssets }],
    [{ value: lateLoans }],
    [{ value: pendingRequests }],
    upcomingReturnRows,
    recentLoanEvents,
    recentAssetEvents,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(assets)
      .where(eq(assets.organizationId, organizationId)),
    db
      .select({ value: count() })
      .from(assets)
      .where(
        and(eq(assets.organizationId, organizationId), eq(assets.status, "available")),
      ),
    db
      .select({ value: count() })
      .from(loans)
      .where(and(eq(loans.organizationId, organizationId), eq(loans.status, "active"))),
    db
      .select({ value: count() })
      .from(loans)
      .where(
        and(
          eq(loans.organizationId, organizationId),
          eq(loans.status, "active"),
          lte(loans.dueAt, now),
        ),
      ),
    db
      .select({ value: count() })
      .from(loanRequests)
      .where(
        and(eq(loanRequests.organizationId, organizationId), eq(loanRequests.status, "pending")),
      ),
    db
      .select({
        loanId: loans.id,
        assetName: assets.name,
        borrowerName: borrowers.displayName,
        dueAt: loans.dueAt,
      })
      .from(loans)
      .innerJoin(assets, eq(assets.id, loans.assetId))
      .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
      .where(and(eq(loans.organizationId, organizationId), eq(loans.status, "active")))
      .orderBy(loans.dueAt)
      .limit(5),
    db
      .select({
        id: loanEvents.id,
        eventType: loanEvents.eventType,
        createdAt: loanEvents.createdAt,
      })
      .from(loanEvents)
      .where(eq(loanEvents.organizationId, organizationId))
      .orderBy(desc(loanEvents.createdAt))
      .limit(5),
    db
      .select({
        id: assetEvents.id,
        eventType: assetEvents.eventType,
        createdAt: assetEvents.createdAt,
      })
      .from(assetEvents)
      .where(eq(assetEvents.organizationId, organizationId))
      .orderBy(desc(assetEvents.createdAt))
      .limit(5),
  ]);

  const recentActivity: RecentActivity[] = [
    ...recentLoanEvents.map((event) => ({ ...event, kind: "loan" as const })),
    ...recentAssetEvents.map((event) => ({ ...event, kind: "asset" as const })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return {
    totalAssets,
    availableAssets,
    borrowedAssets,
    lateLoans,
    pendingRequests,
    upcomingReturns: upcomingReturnRows,
    recentActivity,
  };
}
