import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listCategories } from "@/lib/categories/queries";
import { AssetForm } from "../asset-form";

export default async function NewAssetPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);

  if (!permissions.manageAssets(membership.role as MembershipRole)) {
    notFound();
  }

  const categories = await listCategories(organization.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouvel objet</h1>
      <Card>
        <CardContent className="pt-6">
          <AssetForm organizationId={organization.id} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
