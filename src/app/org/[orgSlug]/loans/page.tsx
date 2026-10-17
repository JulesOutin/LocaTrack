import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listLoans, type LoanListFilters } from "@/lib/loans/queries";
import { LOAN_STATUS_LABELS, type LoanStatus } from "@/lib/loans/schema";
import { formatDateTime } from "@/lib/event-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildQuery } from "@/lib/query-string";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default async function LoansPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { orgSlug } = await params;
  const query = await searchParams;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);
  const role = membership.role as MembershipRole;

  const filters: LoanListFilters = {
    search: query.search,
    status: query.status as LoanListFilters["status"],
    page: query.page ? Number(query.page) : 1,
  };

  const { loans, total, page, pageCount } = await listLoans(organization.id, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Prêts</h1>
          <p className="text-sm text-muted-foreground">{total} prêt(s)</p>
        </div>
        <div className="flex gap-2">
          {permissions.exportData(role) ? (
            <Button variant="outline" asChild>
              <a
                href={`/org/${orgSlug}/loans/export${buildQuery({ search: query.search, status: query.status })}`}
              >
                <Download className="size-4" aria-hidden />
                Exporter
              </a>
            </Button>
          ) : null}
          {permissions.recordLoans(role) ? (
            <Button asChild>
              <Link href={`/org/${orgSlug}/loans/new`}>
                <Plus className="size-4" aria-hidden />
                Nouveau prêt
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Objet ou emprunteur..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:col-span-2"
            />
            <select name="status" defaultValue={query.status ?? ""} className={selectClassName}>
              <option value="">Tous les statuts</option>
              <option value="active">En cours</option>
              <option value="overdue">En retard</option>
              <option value="returned">Rendus</option>
              <option value="cancelled">Annulés</option>
            </select>
            <Button type="submit" variant="secondary" className="sm:col-span-3">
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun prêt ne correspond à ces critères.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {loans.map((loan) => (
            <Link key={loan.id} href={`/org/${orgSlug}/loans/${loan.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-foreground">{loan.assetName}</p>
                    <p className="text-sm text-muted-foreground">{loan.borrowerName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={loan.isOverdue ? "destructive" : "secondary"}>
                      {loan.isOverdue ? "En retard" : LOAN_STATUS_LABELS[loan.status as LoanStatus]}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Retour prévu : {formatDateTime(loan.dueAt, organization.timezone)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <Button variant="outline" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link
                href={`/org/${orgSlug}/loans${buildQuery({ search: query.search, status: query.status, page: String(page - 1) })}`}
              >
                Précédent
              </Link>
            ) : (
              <span>Précédent</span>
            )}
          </Button>
          <span className="text-muted-foreground">
            Page {page} / {pageCount}
          </span>
          <Button variant="outline" disabled={page >= pageCount} asChild={page < pageCount}>
            {page < pageCount ? (
              <Link
                href={`/org/${orgSlug}/loans${buildQuery({ search: query.search, status: query.status, page: String(page + 1) })}`}
              >
                Suivant
              </Link>
            ) : (
              <span>Suivant</span>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
