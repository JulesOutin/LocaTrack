import "server-only";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";

export { extractTokenFromScan } from "./scan-token";

/**
 * Recherche un objet par jeton de QR code exact ou par référence (recherche
 * manuelle), toujours circonscrite à l'organisation courante.
 */
export async function resolveAssetByCodeOrToken(organizationId: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const [byToken] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.organizationId, organizationId), eq(assets.qrToken, trimmed)))
    .limit(1);

  if (byToken) return byToken;

  const [byCode] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.organizationId, organizationId), ilike(assets.assetCode, trimmed)))
    .limit(1);

  return byCode ?? null;
}
