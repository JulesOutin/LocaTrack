"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAccessById } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import { reviewLoanRequestInputSchema } from "@/lib/loan-requests/schema";
import {
  approveLoanRequest,
  rejectLoanRequest,
  RequestNotPendingError,
} from "@/lib/loan-requests/mutations";
import { AssetNotLoanableError } from "@/lib/loans/mutations";

export type ReviewRequestState = { error?: string };

export async function approveLoanRequestAction(
  _prevState: ReviewRequestState,
  formData: FormData,
): Promise<ReviewRequestState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user, settings } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.processLoanRequests(membership.role as MembershipRole, settings));

  const parsed = reviewLoanRequestInputSchema.safeParse({
    requestId: formData.get("requestId"),
    reviewNote: formData.get("reviewNote"),
  });
  if (!parsed.success) {
    return { error: "Requête invalide." };
  }

  try {
    await approveLoanRequest(organization.id, parsed.data.requestId, user.id);
  } catch (error) {
    if (error instanceof RequestNotPendingError) {
      return { error: error.message };
    }
    if (error instanceof AssetNotLoanableError) {
      return { error: "Cet objet n'est plus disponible : la demande ne peut pas être approuvée." };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/requests`);
  revalidatePath(`/org/${organization.slug}/inventory`);
  return {};
}

export async function rejectLoanRequestAction(
  _prevState: ReviewRequestState,
  formData: FormData,
): Promise<ReviewRequestState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user, settings } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.processLoanRequests(membership.role as MembershipRole, settings));

  const parsed = reviewLoanRequestInputSchema.safeParse({
    requestId: formData.get("requestId"),
    reviewNote: formData.get("reviewNote"),
  });
  if (!parsed.success) {
    return { error: "Requête invalide." };
  }

  try {
    await rejectLoanRequest(organization.id, parsed.data.requestId, user.id, parsed.data.reviewNote);
  } catch (error) {
    if (error instanceof RequestNotPendingError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/requests`);
  return {};
}
