import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assetEvents, assets, borrowers, loanEvents, loans } from "@/db/schema";

export type HistoryFilter = "all" | "loans" | "assets";

export type HistoryEntry = {
  id: string;
  kind: "loan" | "asset";
  eventType: string;
  createdAt: Date;
  subject: string;
  detail: string | null;
};

const FETCH_LIMIT = 50;

export async function listOrgHistory(
  organizationId: string,
  filter: HistoryFilter,
): Promise<HistoryEntry[]> {
  const [loanRows, assetRows] = await Promise.all([
    filter === "assets"
      ? []
      : db
          .select({
            id: loanEvents.id,
            eventType: loanEvents.eventType,
            createdAt: loanEvents.createdAt,
            assetName: assets.name,
            borrowerName: borrowers.displayName,
          })
          .from(loanEvents)
          .innerJoin(loans, eq(loans.id, loanEvents.loanId))
          .innerJoin(assets, eq(assets.id, loans.assetId))
          .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
          .where(eq(loanEvents.organizationId, organizationId))
          .orderBy(desc(loanEvents.createdAt))
          .limit(FETCH_LIMIT),
    filter === "loans"
      ? []
      : db
          .select({
            id: assetEvents.id,
            eventType: assetEvents.eventType,
            createdAt: assetEvents.createdAt,
            assetName: assets.name,
          })
          .from(assetEvents)
          .innerJoin(assets, eq(assets.id, assetEvents.assetId))
          .where(and(eq(assetEvents.organizationId, organizationId)))
          .orderBy(desc(assetEvents.createdAt))
          .limit(FETCH_LIMIT),
  ]);

  const entries: HistoryEntry[] = [
    ...loanRows.map((row) => ({
      id: row.id,
      kind: "loan" as const,
      eventType: row.eventType,
      createdAt: row.createdAt,
      subject: row.assetName,
      detail: row.borrowerName,
    })),
    ...assetRows.map((row) => ({
      id: row.id,
      kind: "asset" as const,
      eventType: row.eventType,
      createdAt: row.createdAt,
      subject: row.assetName,
      detail: null,
    })),
  ];

  return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, FETCH_LIMIT);
}
