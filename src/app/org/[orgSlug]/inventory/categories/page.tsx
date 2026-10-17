import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { listCategories } from "@/lib/categories/queries";
import { CreateCategoryForm, DeleteCategoryButton } from "./category-forms";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);

  if (!permissions.manageCategories(membership.role as MembershipRole)) {
    notFound();
  }

  const categories = await listCategories(organization.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Catégories</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm organizationId={organization.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégories existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune catégorie pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    {category.description ? (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    ) : null}
                  </div>
                  <DeleteCategoryButton organizationId={organization.id} categoryId={category.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
