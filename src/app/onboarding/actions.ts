"use server";

import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/stack/server";
import {
  createOrganizationInputSchema,
  createOrganizationWithOwner,
} from "@/lib/organizations/create";

export type CreateOrganizationFormState = {
  error?: string;
};

export async function createOrganizationAction(
  _prevState: CreateOrganizationFormState,
  formData: FormData,
): Promise<CreateOrganizationFormState> {
  const user = await stackServerApp.getUser({ or: "redirect" });

  const parsed = createOrganizationInputSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const organization = await createOrganizationWithOwner(parsed.data, user.id);

  redirect(`/org/${organization.slug}/dashboard`);
}
