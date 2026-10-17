"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgAccessById } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import { assetInputSchema } from "@/lib/assets/schema";
import {
  archiveAsset,
  AssetHasActiveLoanError,
  createAsset,
  DuplicateAssetCodeError,
  setAssetPhoto,
  updateAsset,
} from "@/lib/assets/mutations";
import {
  categoryInputSchema,
  CategoryInUseError,
  createCategory,
  deleteCategory,
} from "@/lib/categories/mutations";

export type AssetFormState = { error?: string };

function parseAssetForm(formData: FormData) {
  return assetInputSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    assetCode: formData.get("assetCode"),
    serialNumber: formData.get("serialNumber"),
    condition: formData.get("condition"),
    status: formData.get("status"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });
}

export async function createAssetAction(
  _prevState: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageAssets(membership.role as MembershipRole));

  const parsed = parseAssetForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    const asset = await createAsset(organization.id, user.id, parsed.data);
    revalidatePath(`/org/${organization.slug}/inventory`);
    redirect(`/org/${organization.slug}/inventory/${asset.id}`);
  } catch (error) {
    if (error instanceof DuplicateAssetCodeError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateAssetAction(
  _prevState: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const assetId = String(formData.get("assetId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageAssets(membership.role as MembershipRole));

  const parsed = parseAssetForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    await updateAsset(organization.id, assetId, user.id, parsed.data);
    revalidatePath(`/org/${organization.slug}/inventory`);
    redirect(`/org/${organization.slug}/inventory/${assetId}`);
  } catch (error) {
    if (error instanceof DuplicateAssetCodeError) {
      return { error: error.message };
    }
    throw error;
  }
}

export type ArchiveAssetState = { error?: string };

export async function archiveAssetAction(
  _prevState: ArchiveAssetState,
  formData: FormData,
): Promise<ArchiveAssetState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const assetId = String(formData.get("assetId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageAssets(membership.role as MembershipRole));

  try {
    await archiveAsset(organization.id, assetId, user.id);
  } catch (error) {
    if (error instanceof AssetHasActiveLoanError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/inventory`);
  revalidatePath(`/org/${organization.slug}/inventory/${assetId}`);
  return {};
}

export type SetAssetPhotoState = { error?: string; photoUrl?: string };

export async function setAssetPhotoAction(
  organizationId: string,
  assetId: string,
  photoUrl: string,
): Promise<SetAssetPhotoState> {
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageAssets(membership.role as MembershipRole));

  // Le fichier a déjà été envoyé directement à Vercel Blob depuis le
  // navigateur ; cette action ne fait qu'enregistrer l'URL obtenue après
  // avoir revérifié l'autorisation côté serveur.
  if (!photoUrl.startsWith("https://")) {
    return { error: "URL de photo invalide." };
  }

  await setAssetPhoto(organization.id, assetId, user.id, photoUrl);
  revalidatePath(`/org/${organization.slug}/inventory/${assetId}`);
  return { photoUrl };
}

export type CategoryFormState = { error?: string };

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageCategories(membership.role as MembershipRole));

  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await createCategory(organization.id, parsed.data);
  revalidatePath(`/org/${organization.slug}/inventory/categories`);
  return {};
}

export async function deleteCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const { organization, membership } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.manageCategories(membership.role as MembershipRole));

  try {
    await deleteCategory(organization.id, categoryId);
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/inventory/categories`);
  return {};
}
