"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgAccessById } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import { borrowerInputSchema } from "@/lib/borrowers/schema";
import { createBorrower, setBorrowerActive, updateBorrower } from "@/lib/borrowers/mutations";

export type BorrowerFormState = { error?: string };

function parseBorrowerForm(formData: FormData) {
  return borrowerInputSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    borrowerCode: formData.get("borrowerCode"),
  });
}

export async function createBorrowerAction(
  _prevState: BorrowerFormState,
  formData: FormData,
): Promise<BorrowerFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageBorrowers(membership.role as MembershipRole));

  const parsed = parseBorrowerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const borrower = await createBorrower(organization.id, parsed.data);
  revalidatePath(`/org/${organization.slug}/borrowers`);
  redirect(`/org/${organization.slug}/borrowers/${borrower.id}`);
}

export async function updateBorrowerAction(
  _prevState: BorrowerFormState,
  formData: FormData,
): Promise<BorrowerFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const borrowerId = String(formData.get("borrowerId") ?? "");
  const { organization, membership } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageBorrowers(membership.role as MembershipRole));

  const parsed = parseBorrowerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await updateBorrower(organization.id, borrowerId, parsed.data);
  revalidatePath(`/org/${organization.slug}/borrowers`);
  revalidatePath(`/org/${organization.slug}/borrowers/${borrowerId}`);
  redirect(`/org/${organization.slug}/borrowers/${borrowerId}`);
}

export type SetBorrowerActiveState = { error?: string };

export async function setBorrowerActiveAction(
  _prevState: SetBorrowerActiveState,
  formData: FormData,
): Promise<SetBorrowerActiveState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const borrowerId = String(formData.get("borrowerId") ?? "");
  const active = formData.get("active") === "true";
  const { organization, membership } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageBorrowers(membership.role as MembershipRole));

  await setBorrowerActive(organization.id, borrowerId, active);
  revalidatePath(`/org/${organization.slug}/borrowers`);
  revalidatePath(`/org/${organization.slug}/borrowers/${borrowerId}`);
  return {};
}
