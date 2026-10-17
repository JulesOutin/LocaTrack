// Fabriques pour les tests d'intégration UNIQUEMENT. Importe "@/db", qui est
// aliasé vers la branche Neon de test par vitest.integration.config.mts —
// ne jamais importer ce fichier depuis le code applicatif.
import { db } from "@/db";
import { assets, borrowers, organizations } from "@/db/schema";
import { generateSecureToken } from "@/lib/tokens";
import { defaultOrganizationSettings } from "@/lib/organizations/settings";

function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function createTestOrganization(
  overrides: Partial<typeof organizations.$inferInsert> = {},
) {
  const suffix = uniqueSuffix();
  const [organization] = await db
    .insert(organizations)
    .values({
      name: `Org de test ${suffix}`,
      slug: `test-org-${suffix}`,
      timezone: "Europe/Paris",
      settings: defaultOrganizationSettings,
      ...overrides,
    })
    .returning();
  return organization;
}

export async function createTestAsset(
  organizationId: string,
  overrides: Partial<typeof assets.$inferInsert> = {},
) {
  const suffix = uniqueSuffix();
  const [asset] = await db
    .insert(assets)
    .values({
      organizationId,
      name: `Objet de test ${suffix}`,
      assetCode: `TEST-${suffix}`,
      qrToken: generateSecureToken(),
      condition: "good",
      status: "available",
      ...overrides,
    })
    .returning();
  return asset;
}

export async function createTestBorrower(
  organizationId: string,
  overrides: Partial<typeof borrowers.$inferInsert> = {},
) {
  const suffix = uniqueSuffix();
  const [borrower] = await db
    .insert(borrowers)
    .values({
      organizationId,
      displayName: `Emprunteur de test ${suffix}`,
      ...overrides,
    })
    .returning();
  return borrower;
}

export function futureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
