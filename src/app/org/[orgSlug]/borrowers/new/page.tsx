import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { BorrowerForm } from "../borrower-form";

export default async function NewBorrowerPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);

  if (!permissions.manageBorrowers(membership.role as MembershipRole)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouvel emprunteur</h1>
      <Card>
        <CardContent className="pt-6">
          <BorrowerForm organizationId={organization.id} />
        </CardContent>
      </Card>
    </div>
  );
}
