"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireOrgAccessById } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import { isValidTimezone } from "@/lib/timezones";
import { z } from "zod";

export type UpdateOrgSettingsState = { error?: string; success?: boolean };

const updateSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  timezone: z.string().refine(isValidTimezone, "Fuseau horaire invalide."),
});

export async function updateOrganizationSettingsAction(
  _prevState: UpdateOrgSettingsState,
  formData: FormData,
): Promise<UpdateOrgSettingsState> {
  const parsed = updateSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // L'organizationId vient du client : on revérifie systématiquement
  // l'appartenance et le rôle en base avant toute écriture.
  const { organization, membership } = await requireOrgAccessById(
    parsed.data.organizationId,
  );

  assertPermission(permissions.manageOrganization(membership.role as MembershipRole));

  await db
    .update(organizations)
    .set({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organization.id));

  revalidatePath(`/org/${organization.slug}/settings`);
  return { success: true };
}
