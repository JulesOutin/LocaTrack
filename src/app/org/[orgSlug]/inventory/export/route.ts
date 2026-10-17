import { NextResponse } from "next/server";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import { listAllAssetsForExport, type AssetListFilters } from "@/lib/assets/queries";
import { ASSET_CONDITION_LABELS, ASSET_STATUS_LABELS } from "@/lib/assets/schema";
import type { AssetCondition, AssetStatus } from "@/lib/assets/schema";
import { formatDateOnly } from "@/lib/event-labels";
import { toCsv } from "@/lib/csv";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);
  assertPermission(permissions.exportData(membership.role as MembershipRole));

  const url = new URL(request.url);
  const filters: AssetListFilters = {
    search: url.searchParams.get("search") ?? undefined,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    status: (url.searchParams.get("status") as AssetStatus | null) ?? undefined,
    condition: (url.searchParams.get("condition") as AssetCondition | null) ?? undefined,
  };

  // Périmètre strict : toujours filtré par l'organisation authentifiée,
  // jamais par un identifiant transmis par le client.
  const rows = await listAllAssetsForExport(organization.id, filters);

  const csv = toCsv(
    ["Nom", "Référence", "Numéro de série", "Catégorie", "État", "Disponibilité", "Emplacement", "Créé le"],
    rows.map((row) => [
      row.name,
      row.assetCode,
      row.serialNumber,
      row.categoryName,
      ASSET_CONDITION_LABELS[row.condition as AssetCondition],
      ASSET_STATUS_LABELS[row.status as AssetStatus],
      row.location,
      formatDateOnly(row.createdAt, organization.timezone),
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventaire-${organization.slug}.csv"`,
    },
  });
}
