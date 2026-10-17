import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { getAssetById } from "@/lib/assets/queries";
import { listCategories } from "@/lib/categories/queries";
import { AssetForm } from "../../asset-form";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ orgSlug: string; assetId: string }>;
}) {
  const { orgSlug, assetId } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);

  if (!permissions.manageAssets(membership.role as MembershipRole)) {
    notFound();
  }

  const [asset, categories] = await Promise.all([
    getAssetById(organization.id, assetId),
    listCategories(organization.id),
  ]);

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Modifier {asset.name}
      </h1>
      <Card>
        <CardContent className="pt-6">
          <AssetForm organizationId={organization.id} categories={categories} asset={asset} />
        </CardContent>
      </Card>
    </div>
  );
}
