import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

export async function listCategories(organizationId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.organizationId, organizationId))
    .orderBy(asc(categories.name));
}
