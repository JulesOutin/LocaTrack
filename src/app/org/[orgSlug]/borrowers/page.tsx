import Link from "next/link";
import { Plus } from "lucide-react";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listBorrowers, type BorrowerListFilters } from "@/lib/borrowers/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildQuery } from "@/lib/query-string";

export default async function BorrowersPage({
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

  const filters: BorrowerListFilters = {
    search: query.search,
    activeOnly: query.activeOnly === "1",
    page: query.page ? Number(query.page) : 1,
  };

  const { borrowers, total, page, pageCount } = await listBorrowers(organization.id, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Emprunteurs</h1>
          <p className="text-sm text-muted-foreground">{total} emprunteur(s)</p>
        </div>
        {permissions.manageBorrowers(role) ? (
          <Button asChild>
            <Link href={`/org/${orgSlug}/borrowers/new`}>
              <Plus className="size-4" aria-hidden />
              Nouvel emprunteur
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="flex flex-wrap gap-3">
            <input
              type="text"
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Nom, e-mail, code..."
              className="flex h-9 flex-1 min-w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="activeOnly" value="1" defaultChecked={query.activeOnly === "1"} />
              Actifs uniquement
            </label>
            <Button type="submit" variant="secondary">
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {borrowers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun emprunteur ne correspond à ces critères.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {borrowers.map((borrower) => (
            <Link key={borrower.id} href={`/org/${orgSlug}/borrowers/${borrower.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-foreground">{borrower.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {borrower.email ?? borrower.borrowerCode ?? "—"}
                    </p>
                  </div>
                  <Badge variant={borrower.active ? "secondary" : "outline"}>
                    {borrower.active ? "Actif" : "Désactivé"}
                  </Badge>
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
                href={`/org/${orgSlug}/borrowers${buildQuery({
                  search: query.search,
                  activeOnly: query.activeOnly,
                  page: String(page - 1),
                })}`}
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
                href={`/org/${orgSlug}/borrowers${buildQuery({
                  search: query.search,
                  activeOnly: query.activeOnly,
                  page: String(page + 1),
                })}`}
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
