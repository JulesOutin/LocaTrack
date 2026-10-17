import { NextResponse } from "next/server";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import { listAllLoansForExport, type LoanListFilters } from "@/lib/loans/queries";
import { LOAN_STATUS_LABELS, type LoanStatus } from "@/lib/loans/schema";
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
  const filters: LoanListFilters = {
    search: url.searchParams.get("search") ?? undefined,
    status: (url.searchParams.get("status") as LoanListFilters["status"]) ?? undefined,
  };

  const rows = await listAllLoansForExport(organization.id, filters);

  const csv = toCsv(
    ["Objet", "Référence", "Emprunteur", "Prêté le", "Retour prévu", "Retourné le", "Statut"],
    rows.map((row) => [
      row.assetName,
      row.assetCode,
      row.borrowerName,
      formatDateOnly(row.loanedAt, organization.timezone),
      formatDateOnly(row.dueAt, organization.timezone),
      row.returnedAt ? formatDateOnly(row.returnedAt, organization.timezone) : "",
      row.isOverdue ? "En retard" : LOAN_STATUS_LABELS[row.status as LoanStatus],
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prets-${organization.slug}.csv"`,
    },
  });
}
