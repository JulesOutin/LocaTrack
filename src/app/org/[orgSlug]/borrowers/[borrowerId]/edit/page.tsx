import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { getBorrowerById } from "@/lib/borrowers/queries";
import { BorrowerForm } from "../../borrower-form";

export default async function EditBorrowerPage({
  params,
}: {
  params: Promise<{ orgSlug: string; borrowerId: string }>;
}) {
  const { orgSlug, borrowerId } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);

  if (!permissions.manageBorrowers(membership.role as MembershipRole)) {
    notFound();
  }

  const borrower = await getBorrowerById(organization.id, borrowerId);
  if (!borrower) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Modifier {borrower.displayName}
      </h1>
      <Card>
        <CardContent className="pt-6">
          <BorrowerForm organizationId={organization.id} borrower={borrower} />
        </CardContent>
      </Card>
    </div>
  );
}
