"use server";

import { requireOrgAccessById } from "@/lib/org-access";
import { extractTokenFromScan, resolveAssetByCodeOrToken } from "@/lib/assets/resolve";

export type ResolveScanResult = { assetId: string } | { error: string };

export async function resolveScanInput(
  organizationId: string,
  rawInput: string,
): Promise<ResolveScanResult> {
  const { organization } = await requireOrgAccessById(organizationId);

  const token = extractTokenFromScan(rawInput);
  const asset = await resolveAssetByCodeOrToken(organization.id, token);

  if (!asset) {
    return { error: "Aucun objet trouvé pour ce code dans cette organisation." };
  }

  return { assetId: asset.id };
}
