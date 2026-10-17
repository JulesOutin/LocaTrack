import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listAvailableAssetsForSelect } from "@/lib/loans/queries";
import { listActiveBorrowersForSelect } from "@/lib/borrowers/queries";
import { LoanForm } from "./loan-form";

export default async function NewLoanPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ assetId?: string }>;
}) {
  const { orgSlug } = await params;
  const { assetId } = await searchParams;
  const { organization, membership, settings } = await requireOrgAccessBySlug(orgSlug);

  if (!permissions.recordLoans(membership.role as MembershipRole)) {
    notFound();
  }

  const [assets, borrowers] = await Promise.all([
    listAvailableAssetsForSelect(organization.id),
    listActiveBorrowersForSelect(organization.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouveau prêt</h1>
      <Card>
        <CardContent className="pt-6">
          <LoanForm
            organizationId={organization.id}
            assets={assets}
            borrowers={borrowers}
            defaultAssetId={assetId}
            defaultLoanDurationDays={settings.defaultLoanDurationDays}
          />
        </CardContent>
      </Card>
    </div>
  );
}
