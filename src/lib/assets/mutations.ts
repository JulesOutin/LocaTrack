import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assetEvents, assets, loans } from "@/db/schema";
import { generateSecureToken } from "@/lib/tokens";
import { isUniqueViolation } from "@/lib/db-errors";
import type { AssetInput } from "@/lib/assets/schema";

export class DuplicateAssetCodeError extends Error {
  constructor() {
    super("Cette référence est déjà utilisée par un autre objet de l'organisation.");
    this.name = "DuplicateAssetCodeError";
  }
}

export class AssetHasActiveLoanError extends Error {
  constructor() {
    super("Cet objet a un prêt actif : il ne peut pas être archivé.");
    this.name = "AssetHasActiveLoanError";
  }
}

export async function createAsset(
  organizationId: string,
  actorUserId: string,
  input: AssetInput,
) {
  try {
    return await db.transaction(async (tx) => {
      const [asset] = await tx
        .insert(assets)
        .values({
          organizationId,
          categoryId: input.categoryId,
          name: input.name,
          assetCode: input.assetCode,
          qrToken: generateSecureToken(),
          serialNumber: input.serialNumber,
          condition: input.condition,
          status: input.status,
          location: input.location,
          notes: input.notes,
        })
        .returning();

      await tx.insert(assetEvents).values({
        organizationId,
        assetId: asset.id,
        actorUserId,
        eventType: "asset_created",
        metadata: { name: asset.name, assetCode: asset.assetCode },
      });

      return asset;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateAssetCodeError();
    }
    throw error;
  }
}

export async function updateAsset(
  organizationId: string,
  assetId: string,
  actorUserId: string,
  input: AssetInput,
) {
  try {
    return await db.transaction(async (tx) => {
      const [asset] = await tx
        .update(assets)
        .set({
          categoryId: input.categoryId,
          name: input.name,
          assetCode: input.assetCode,
          serialNumber: input.serialNumber,
          condition: input.condition,
          status: input.status,
          location: input.location,
          notes: input.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(assets.organizationId, organizationId), eq(assets.id, assetId)))
        .returning();

      if (!asset) {
        throw new Error("Objet introuvable.");
      }

      await tx.insert(assetEvents).values({
        organizationId,
        assetId: asset.id,
        actorUserId,
        eventType: "asset_updated",
        metadata: { name: asset.name, assetCode: asset.assetCode },
      });

      return asset;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateAssetCodeError();
    }
    throw error;
  }
}

export async function setAssetPhoto(
  organizationId: string,
  assetId: string,
  actorUserId: string,
  photoUrl: string,
) {
  return db.transaction(async (tx) => {
    const [asset] = await tx
      .update(assets)
      .set({ photoUrl, updatedAt: new Date() })
      .where(and(eq(assets.organizationId, organizationId), eq(assets.id, assetId)))
      .returning();

    if (!asset) {
      throw new Error("Objet introuvable.");
    }

    await tx.insert(assetEvents).values({
      organizationId,
      assetId: asset.id,
      actorUserId,
      eventType: "asset_photo_updated",
      metadata: {},
    });

    return asset;
  });
}

export async function archiveAsset(
  organizationId: string,
  assetId: string,
  actorUserId: string,
) {
  return db.transaction(async (tx) => {
    const [activeLoan] = await tx
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.organizationId, organizationId),
          eq(loans.assetId, assetId),
          eq(loans.status, "active"),
        ),
      )
      .limit(1);

    if (activeLoan) {
      throw new AssetHasActiveLoanError();
    }

    const [asset] = await tx
      .update(assets)
      .set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(assets.organizationId, organizationId), eq(assets.id, assetId)))
      .returning();

    if (!asset) {
      throw new Error("Objet introuvable.");
    }

    await tx.insert(assetEvents).values({
      organizationId,
      assetId: asset.id,
      actorUserId,
      eventType: "asset_archived",
      metadata: { name: asset.name },
    });

    return asset;
  });
}
