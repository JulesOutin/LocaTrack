import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { defaultOrganizationSettings } from "@/lib/organizations/settings";
import { randomSlugSuffix, slugify } from "@/lib/slug";
import { isValidTimezone } from "@/lib/timezones";

export const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  timezone: z.string().refine(isValidTimezone, "Fuseau horaire invalide."),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;

const MAX_SLUG_ATTEMPTS = 5;

/**
 * Crée l'organisation et sa première adhésion (owner) de façon atomique.
 * Le slug est dérivé du nom ; en cas de collision (unicité en base), on
 * retente avec un suffixe aléatoire plutôt que d'échouer bêtement — rend
 * l'opération robuste même en cas de double soumission concurrente.
 */
export async function createOrganizationWithOwner(
  input: CreateOrganizationInput,
  ownerUserId: string,
) {
  const baseSlug = slugify(input.name) || "organisation";

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomSlugSuffix()}`;

    try {
      return await db.transaction(async (tx) => {
        const [organization] = await tx
          .insert(organizations)
          .values({
            name: input.name,
            slug,
            timezone: input.timezone,
            settings: defaultOrganizationSettings,
          })
          .returning();

        await tx.insert(memberships).values({
          organizationId: organization.id,
          userId: ownerUserId,
          role: "owner",
        });

        return organization;
      });
    } catch (error) {
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505";

      if (!isUniqueViolation || attempt === MAX_SLUG_ATTEMPTS - 1) {
        throw error;
      }
      // Collision de slug : on retente avec un nouveau suffixe.
    }
  }

  throw new Error("Impossible de générer un identifiant d'organisation unique.");
}

export async function findFirstMembershipOrgSlug(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ slug: organizations.slug })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, userId))
    .orderBy(memberships.createdAt)
    .limit(1);

  return row?.slug ?? null;
}
