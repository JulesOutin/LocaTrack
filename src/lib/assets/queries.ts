import "server-only";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import {
  assetEvents,
  assets,
  borrowers,
  categories,
  loans,
  organizations,
} from "@/db/schema";
import type { AssetCondition, AssetStatus } from "@/lib/assets/schema";

export const ASSETS_PAGE_SIZE = 20;

export type AssetListFilters = {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  page?: number;
};

function buildAssetWhere(organizationId: string, filters: AssetListFilters) {
  const conditions = [eq(assets.organizationId, organizationId)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(assets.name, term),
        ilike(assets.assetCode, term),
        ilike(assets.serialNumber, term),
      )!,
    );
  }
  if (filters.categoryId) {
    conditions.push(eq(assets.categoryId, filters.categoryId));
  }
  if (filters.status) {
    conditions.push(eq(assets.status, filters.status));
  }
  if (filters.condition) {
    conditions.push(eq(assets.condition, filters.condition));
  }

  return and(...conditions);
}

export async function listAssets(organizationId: string, filters: AssetListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildAssetWhere(organizationId, filters);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: assets.id,
        name: assets.name,
        assetCode: assets.assetCode,
        serialNumber: assets.serialNumber,
        condition: assets.condition,
        status: assets.status,
        location: assets.location,
        categoryName: categories.name,
      })
      .from(assets)
      .leftJoin(categories, eq(categories.id, assets.categoryId))
      .where(where)
      .orderBy(asc(assets.name))
      .limit(ASSETS_PAGE_SIZE)
      .offset((page - 1) * ASSETS_PAGE_SIZE),
    db.select({ value: count() }).from(assets).where(where),
  ]);

  return {
    assets: rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ASSETS_PAGE_SIZE)),
  };
}

/** Export CSV : mêmes filtres que la liste, sans pagination. */
export async function listAllAssetsForExport(organizationId: string, filters: AssetListFilters) {
  const where = buildAssetWhere(organizationId, filters);

  return db
    .select({
      name: assets.name,
      assetCode: assets.assetCode,
      serialNumber: assets.serialNumber,
      categoryName: categories.name,
      condition: assets.condition,
      status: assets.status,
      location: assets.location,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .leftJoin(categories, eq(categories.id, assets.categoryId))
    .where(where)
    .orderBy(asc(assets.name));
}

export async function getAssetById(organizationId: string, assetId: string) {
  const [asset] = await db
    .select({
      id: assets.id,
      organizationId: assets.organizationId,
      name: assets.name,
      assetCode: assets.assetCode,
      qrToken: assets.qrToken,
      serialNumber: assets.serialNumber,
      photoUrl: assets.photoUrl,
      condition: assets.condition,
      status: assets.status,
      location: assets.location,
      notes: assets.notes,
      categoryId: assets.categoryId,
      categoryName: categories.name,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
      archivedAt: assets.archivedAt,
    })
    .from(assets)
    .leftJoin(categories, eq(categories.id, assets.categoryId))
    .where(and(eq(assets.organizationId, organizationId), eq(assets.id, assetId)))
    .limit(1);

  return asset ?? null;
}

/**
 * Accès public (page de scan QR) : seules les informations non sensibles
 * sont sélectionnées. Aucune donnée d'emprunteur, note interne ou
 * identifiant d'organisation n'est exposée.
 */
export async function getPublicAssetByQrToken(qrToken: string) {
  const [asset] = await db
    .select({
      id: assets.id,
      name: assets.name,
      status: assets.status,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationTimezone: organizations.timezone,
      organizationSettings: organizations.settings,
    })
    .from(assets)
    .innerJoin(organizations, eq(organizations.id, assets.organizationId))
    .where(eq(assets.qrToken, qrToken))
    .limit(1);

  return asset ?? null;
}

export async function getAssetEventHistory(organizationId: string, assetId: string) {
  return db
    .select()
    .from(assetEvents)
    .where(and(eq(assetEvents.organizationId, organizationId), eq(assetEvents.assetId, assetId)))
    .orderBy(desc(assetEvents.createdAt))
    .limit(20);
}

export async function getAssetLoanHistory(organizationId: string, assetId: string) {
  return db
    .select({
      id: loans.id,
      borrowerName: borrowers.displayName,
      loanedAt: loans.loanedAt,
      dueAt: loans.dueAt,
      returnedAt: loans.returnedAt,
      status: loans.status,
    })
    .from(loans)
    .innerJoin(borrowers, eq(borrowers.id, loans.borrowerId))
    .where(and(eq(loans.organizationId, organizationId), eq(loans.assetId, assetId)))
    .orderBy(desc(loans.loanedAt))
    .limit(20);
}
