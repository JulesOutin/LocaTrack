import { z } from "zod";

// Schéma de validation du JSONB `organizations.settings`. Toute lecture ou
// écriture de ce champ doit passer par ce schéma : il n'y a pas d'autre
// endroit où ces règles d'organisation sont stockées (voir memberships, qui
// ne porte qu'un rôle, pas de permissions fines).
export const organizationSettingsSchema = z.object({
  allowPublicLoanRequests: z.boolean().default(true),
  requireApprovalForLoanRequests: z.boolean().default(true),
  adminsCanManageMembers: z.boolean().default(false),
  managersCanProcessRequests: z.boolean().default(false),
  defaultLoanDurationDays: z.number().int().min(1).max(365).default(14),
});

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

export const defaultOrganizationSettings: OrganizationSettings =
  organizationSettingsSchema.parse({});

export function parseOrganizationSettings(value: unknown): OrganizationSettings {
  const result = organizationSettingsSchema.safeParse(value);
  return result.success ? result.data : defaultOrganizationSettings;
}
