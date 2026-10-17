import Link from "next/link";
import { Download, Plus, Settings2 } from "lucide-react";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listAssets, type AssetListFilters } from "@/lib/assets/queries";
import { listCategories } from "@/lib/categories/queries";
import {
  ASSET_CONDITION_LABELS,
  ASSET_CONDITIONS,
  ASSET_STATUS_LABELS,
  ASSET_STATUSES,
  type AssetCondition,
  type AssetStatus,
} from "@/lib/assets/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildQuery } from "@/lib/query-string";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default async function InventoryPage({
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

  const filters: AssetListFilters = {
    search: query.search,
    categoryId: query.categoryId,
    status: query.status as AssetStatus | undefined,
    condition: query.condition as AssetCondition | undefined,
    page: query.page ? Number(query.page) : 1,
  };

  const [{ assets, total, page, pageCount }, categories] = await Promise.all([
    listAssets(organization.id, filters),
    listCategories(organization.id),
  ]);

  const baseFilters = {
    search: query.search,
    categoryId: query.categoryId,
    status: query.status,
    condition: query.condition,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Matériel</h1>
          <p className="text-sm text-muted-foreground">{total} objet(s)</p>
        </div>
        <div className="flex gap-2">
          {permissions.exportData(role) ? (
            <Button variant="outline" asChild>
              <a href={`/org/${orgSlug}/inventory/export${buildQuery(baseFilters)}`}>
                <Download className="size-4" aria-hidden />
                Exporter
              </a>
            </Button>
          ) : null}
          {permissions.manageCategories(role) ? (
            <Button variant="outline" asChild>
              <Link href={`/org/${orgSlug}/inventory/categories`}>
                <Settings2 className="size-4" aria-hidden />
                Catégories
              </Link>
            </Button>
          ) : null}
          {permissions.manageAssets(role) ? (
            <Button asChild>
              <Link href={`/org/${orgSlug}/inventory/new`}>
                <Plus className="size-4" aria-hidden />
                Nouvel objet
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="grid gap-3 sm:grid-cols-4">
            <input
              type="text"
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Nom, référence, numéro de série..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:col-span-2"
            />
            <select name="categoryId" defaultValue={query.categoryId ?? ""} className={selectClassName}>
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={query.status ?? ""} className={selectClassName}>
              <option value="">Toutes les disponibilités</option>
              {ASSET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ASSET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <select name="condition" defaultValue={query.condition ?? ""} className={selectClassName}>
              <option value="">Tous les états</option>
              {ASSET_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {ASSET_CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>
            <div className="flex gap-2 sm:col-span-4">
              <Button type="submit" variant="secondary">
                Filtrer
              </Button>
              <Button type="submit" variant="ghost" formAction={`/org/${orgSlug}/inventory`}>
                Réinitialiser
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun objet ne correspond à ces critères.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Référence</th>
                  <th className="px-4 py-2 font-medium">Catégorie</th>
                  <th className="px-4 py-2 font-medium">Disponibilité</th>
                  <th className="px-4 py-2 font-medium">Emplacement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <Link
                        href={`/org/${orgSlug}/inventory/${asset.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {asset.assetCode}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {asset.categoryName ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">
                        {ASSET_STATUS_LABELS[asset.status as AssetStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{asset.location ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {assets.map((asset) => (
              <Link key={asset.id} href={`/org/${orgSlug}/inventory/${asset.id}`}>
                <Card>
                  <CardContent className="space-y-1 py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{asset.name}</p>
                      <Badge variant="secondary">
                        {ASSET_STATUS_LABELS[asset.status as AssetStatus]}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{asset.assetCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.categoryName ?? "Sans catégorie"}
                      {asset.location ? ` · ${asset.location}` : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="outline"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link
                    href={`/org/${orgSlug}/inventory${buildQuery({ ...baseFilters, page: String(page - 1) })}`}
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
                    href={`/org/${orgSlug}/inventory${buildQuery({ ...baseFilters, page: String(page + 1) })}`}
                  >
                    Suivant
                  </Link>
                ) : (
                  <span>Suivant</span>
                )}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
