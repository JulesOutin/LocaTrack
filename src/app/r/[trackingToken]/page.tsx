import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicLoanRequestByTrackingToken } from "@/lib/loan-requests/queries";
import { LOAN_REQUEST_STATUS_LABELS, type LoanRequestStatus } from "@/lib/loan-requests/schema";
import { formatDateOnly } from "@/lib/event-labels";
import { CancelRequestButton } from "./cancel-button";

export default async function RequestTrackingPage({
  params,
}: {
  params: Promise<{ trackingToken: string }>;
}) {
  const { trackingToken } = await params;
  const request = await getPublicLoanRequestByTrackingToken(trackingToken);

  if (!request) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Suivi de votre demande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{request.organizationName}</p>
          <p className="text-lg font-semibold text-foreground">{request.assetName}</p>
          <Badge variant={request.status === "pending" ? "outline" : "secondary"} className="text-sm">
            {LOAN_REQUEST_STATUS_LABELS[request.status as LoanRequestStatus]}
          </Badge>

          <dl className="space-y-1 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Demandé le</dt>
              <dd className="text-foreground">{formatDateOnly(request.requestedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Retour souhaité</dt>
              <dd className="text-foreground">{formatDateOnly(request.requestedDueAt)}</dd>
            </div>
          </dl>

          {request.reviewNote ? (
            <p className="rounded-md bg-muted p-3 text-left text-sm text-muted-foreground">
              {request.reviewNote}
            </p>
          ) : null}

          {request.status === "pending" ? (
            <CancelRequestButton trackingToken={trackingToken} />
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
