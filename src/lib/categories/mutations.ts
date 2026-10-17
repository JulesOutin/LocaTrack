import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, categories } from "@/db/schema";
import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export async function createCategory(organizationId: string, input: CategoryInput) {
  const [category] = await db
    .insert(categories)
    .values({ organizationId, name: input.name, description: input.description })
    .returning();
  return category;
}

export class CategoryInUseError extends Error {
  constructor() {
    super("Cette catégorie est encore utilisée par des objets : retirez-la d'abord de ces objets.");
    this.name = "CategoryInUseError";
  }
}

export async function deleteCategory(organizationId: string, categoryId: string) {
  const [assetUsingCategory] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.organizationId, organizationId), eq(assets.categoryId, categoryId)))
    .limit(1);

  if (assetUsingCategory) {
    throw new CategoryInUseError();
  }

  await db
    .delete(categories)
    .where(and(eq(categories.organizationId, organizationId), eq(categories.id, categoryId)));
}
