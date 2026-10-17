import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { getBorrowerById, getBorrowerLoanHistory } from "@/lib/borrowers/queries";
import { LOAN_STATUS_LABELS, type LoanStatus } from "@/lib/loans/schema";
import { formatDateTime } from "@/lib/event-labels";
import { ToggleActiveButton } from "../toggle-active-button";

export default async function BorrowerDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; borrowerId: string }>;
}) {
  const { orgSlug, borrowerId } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);
  const role = membership.role as MembershipRole;

  const borrower = await getBorrowerById(organization.id, borrowerId);
  if (!borrower) {
    notFound();
  }

  const history = await getBorrowerLoanHistory(organization.id, borrowerId);
  const activeLoans = history.filter((loan) => loan.status === "active");
  const canManage = permissions.manageBorrowers(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {borrower.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {borrower.email ?? borrower.borrowerCode ?? "Aucune information de contact"}
          </p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/org/${orgSlug}/borrowers/${borrower.id}/edit`}>
                <Pencil className="size-4" aria-hidden />
                Modifier
              </Link>
            </Button>
            <ToggleActiveButton
              organizationId={organization.id}
              borrowerId={borrower.id}
              active={borrower.active}
            />
          </div>
        ) : null}
      </div>

      <Badge variant={borrower.active ? "secondary" : "outline"}>
        {borrower.active ? "Actif" : "Désactivé"}
      </Badge>

      <Card>
        <CardHeader>
          <CardTitle>Prêts actifs</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun prêt en cours.</p>
          ) : (
            <ul className="space-y-3">
              {activeLoans.map((loan) => (
                <li key={loan.id} className="flex justify-between text-sm">
                  <Link
                    href={`/org/${orgSlug}/loans/${loan.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {loan.assetName}
                  </Link>
                  <span className="text-muted-foreground">
                    à rendre le {formatDateTime(loan.dueAt, organization.timezone)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des prêts</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun prêt enregistré.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((loan) => (
                <li key={loan.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/org/${orgSlug}/loans/${loan.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {loan.assetName}
                    </Link>
                    <p className="text-muted-foreground">{formatDateTime(loan.loanedAt, organization.timezone)}</p>
                  </div>
                  <Badge variant="secondary">{LOAN_STATUS_LABELS[loan.status as LoanStatus]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
