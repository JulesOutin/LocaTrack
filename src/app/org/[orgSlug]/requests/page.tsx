import Link from "next/link";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listLoanRequests, type LoanRequestListFilters } from "@/lib/loan-requests/queries";
import {
  LOAN_REQUEST_STATUS_LABELS,
  type LoanRequestStatus,
} from "@/lib/loan-requests/schema";
import { formatDateOnly } from "@/lib/event-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApproveButton, RejectForm } from "./review-actions";

const TABS: { value: LoanRequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvées" },
  { value: "rejected", label: "Refusées" },
  { value: "cancelled", label: "Annulées" },
  { value: "all", label: "Toutes" },
];

export default async function RequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orgSlug } = await params;
  const { status } = await searchParams;
  const { organization, membership, settings } = await requireOrgAccessBySlug(orgSlug);
  const role = membership.role as MembershipRole;

  const activeTab: LoanRequestStatus | "all" =
    status && TABS.some((tab) => tab.value === status) ? (status as LoanRequestStatus | "all") : "pending";

  const filters: LoanRequestListFilters = {
    status: activeTab === "all" ? undefined : activeTab,
  };

  const { requests, total } = await listLoanRequests(organization.id, filters);
  const canReview = permissions.processLoanRequests(role, settings);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Demandes</h1>
        <p className="text-sm text-muted-foreground">{total} demande(s)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "secondary" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/org/${orgSlug}/requests?status=${tab.value}`}>{tab.label}</Link>
          </Button>
        ))}
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune demande dans cette catégorie.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{request.assetName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.requesterName}
                      {request.requesterEmail ? ` · ${request.requesterEmail}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Demandé le {formatDateOnly(request.requestedAt, organization.timezone)} · Retour
                      souhaité : {formatDateOnly(request.requestedDueAt, organization.timezone)}
                    </p>
                  </div>
                  <Badge variant={request.status === "pending" ? "outline" : "secondary"}>
                    {LOAN_REQUEST_STATUS_LABELS[request.status as LoanRequestStatus]}
                  </Badge>
                </div>

                {request.reviewNote ? (
                  <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                    {request.reviewNote}
                  </p>
                ) : null}

                {canReview && request.status === "pending" ? (
                  <div className="flex flex-wrap items-start gap-2">
                    <ApproveButton organizationId={organization.id} requestId={request.id} />
                    <RejectForm organizationId={organization.id} requestId={request.id} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
