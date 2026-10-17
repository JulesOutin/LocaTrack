"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgAccessById } from "@/lib/org-access";
import { permissions, assertPermission, type MembershipRole } from "@/lib/permissions";
import {
  cancelLoanInputSchema,
  createLoanInputSchema,
  extendLoanInputSchema,
  returnLoanInputSchema,
} from "@/lib/loans/schema";
import {
  AssetAlreadyLoanedError,
  AssetNotLoanableError,
  LoanNotActiveError,
  cancelLoan,
  createLoan,
  extendLoan,
  returnLoan,
} from "@/lib/loans/mutations";
import { dueDateToUtc } from "@/lib/loans/due-date";

export type LoanFormState = { error?: string };

export async function createLoanAction(
  _prevState: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.recordLoans(membership.role as MembershipRole));

  const parsed = createLoanInputSchema.safeParse({
    assetId: formData.get("assetId"),
    borrowerId: formData.get("borrowerId"),
    newBorrowerName: formData.get("newBorrowerName"),
    dueAt: formData.get("dueAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    const loan = await createLoan({
      organizationId: organization.id,
      actorUserId: user.id,
      assetId: parsed.data.assetId,
      borrowerId: parsed.data.borrowerId,
      newBorrowerName: parsed.data.newBorrowerName,
      dueAt: dueDateToUtc(parsed.data.dueAt, organization.timezone),
      notes: parsed.data.notes,
    });
    revalidatePath(`/org/${organization.slug}/loans`);
    revalidatePath(`/org/${organization.slug}/inventory/${parsed.data.assetId}`);
    redirect(`/org/${organization.slug}/loans/${loan.id}`);
  } catch (error) {
    if (error instanceof AssetNotLoanableError || error instanceof AssetAlreadyLoanedError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function extendLoanAction(
  _prevState: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.recordLoans(membership.role as MembershipRole));

  const parsed = extendLoanInputSchema.safeParse({
    loanId: formData.get("loanId"),
    dueAt: formData.get("dueAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    await extendLoan(
      organization.id,
      parsed.data.loanId,
      user.id,
      dueDateToUtc(parsed.data.dueAt, organization.timezone),
    );
  } catch (error) {
    if (error instanceof LoanNotActiveError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/loans/${parsed.data.loanId}`);
  revalidatePath(`/org/${organization.slug}/loans`);
  return {};
}

export async function cancelLoanAction(
  _prevState: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.recordLoans(membership.role as MembershipRole));

  const parsed = cancelLoanInputSchema.safeParse({ loanId: formData.get("loanId") });
  if (!parsed.success) {
    return { error: "Requête invalide." };
  }

  try {
    await cancelLoan(organization.id, parsed.data.loanId, user.id);
  } catch (error) {
    if (error instanceof LoanNotActiveError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/loans/${parsed.data.loanId}`);
  revalidatePath(`/org/${organization.slug}/loans`);
  revalidatePath(`/org/${organization.slug}/inventory`);
  return {};
}

export async function returnLoanAction(
  _prevState: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const { organization, membership, user } = await requireOrgAccessById(organizationId);
  assertPermission(permissions.recordLoans(membership.role as MembershipRole));

  const parsed = returnLoanInputSchema.safeParse({
    loanId: formData.get("loanId"),
    condition: formData.get("condition"),
    nextStatus: formData.get("nextStatus"),
    incidentNote: formData.get("incidentNote"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    await returnLoan({
      organizationId: organization.id,
      loanId: parsed.data.loanId,
      actorUserId: user.id,
      condition: parsed.data.condition,
      nextStatus: parsed.data.nextStatus,
      incidentNote: parsed.data.incidentNote,
    });
  } catch (error) {
    if (error instanceof LoanNotActiveError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/org/${organization.slug}/loans/${parsed.data.loanId}`);
  revalidatePath(`/org/${organization.slug}/loans`);
  revalidatePath(`/org/${organization.slug}/inventory`);
  return {};
}
