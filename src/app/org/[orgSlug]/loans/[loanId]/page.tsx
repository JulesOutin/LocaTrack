import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { getLoanById, getLoanEventHistory } from "@/lib/loans/queries";
import { LOAN_STATUS_LABELS, type LoanStatus } from "@/lib/loans/schema";
import { EVENT_LABELS, formatDateTime } from "@/lib/event-labels";
import { ExtendForm } from "./extend-form";
import { CancelButton } from "./cancel-button";
import { ReturnForm } from "./return-form";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; loanId: string }>;
}) {
  const { orgSlug, loanId } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);
  const role = membership.role as MembershipRole;

  const loan = await getLoanById(organization.id, loanId);
  if (!loan) {
    notFound();
  }

  const events = await getLoanEventHistory(organization.id, loanId);
  const canAct = permissions.recordLoans(role);
  const currentDueDate = formatInTimeZone(loan.dueAt, organization.timezone, "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            <Link href={`/org/${orgSlug}/inventory/${loan.assetId}`} className="hover:underline">
              {loan.assetName}
            </Link>
          </h1>
          <p className="text-sm text-muted-foreground">
            Emprunté par{" "}
            <Link href={`/org/${orgSlug}/borrowers/${loan.borrowerId}`} className="hover:underline">
              {loan.borrowerName}
            </Link>
          </p>
        </div>
        <Badge variant={loan.isOverdue ? "destructive" : "secondary"}>
          {loan.isOverdue ? "En retard" : LOAN_STATUS_LABELS[loan.status as LoanStatus]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Référence</dt>
              <dd className="font-mono text-foreground">{loan.assetCode}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Prêté le</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(loan.loanedAt, organization.timezone)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Retour prévu</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(loan.dueAt, organization.timezone)}
              </dd>
            </div>
            {loan.returnedAt ? (
              <div>
                <dt className="text-muted-foreground">Retourné le</dt>
                <dd className="font-medium text-foreground">
                  {formatDateTime(loan.returnedAt, organization.timezone)}
                </dd>
              </div>
            ) : null}
            {loan.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap font-medium text-foreground">{loan.notes}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      {canAct && loan.status === "active" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Retour</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnForm organizationId={organization.id} loanId={loan.id} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prolonger</CardTitle>
              </CardHeader>
              <CardContent>
                <ExtendForm
                  organizationId={organization.id}
                  loanId={loan.id}
                  currentDueDate={currentDueDate}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annuler</CardTitle>
              </CardHeader>
              <CardContent>
                <CancelButton organizationId={organization.id} loanId={loan.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Historique du prêt</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {EVENT_LABELS[event.eventType] ?? event.eventType}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDateTime(event.createdAt, organization.timezone)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
