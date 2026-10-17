"use server";

import { redirect } from "next/navigation";
import { getPublicAssetByQrToken } from "@/lib/assets/queries";
import { publicLoanRequestInputSchema } from "@/lib/loan-requests/schema";
import { createLoanRequest, AssetNotRequestableError } from "@/lib/loan-requests/mutations";
import { parseOrganizationSettings } from "@/lib/organizations/settings";
import { dueDateToUtc } from "@/lib/loans/due-date";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export type PublicLoanRequestState = { error?: string };

export async function submitPublicLoanRequestAction(
  _prevState: PublicLoanRequestState,
  formData: FormData,
): Promise<PublicLoanRequestState> {
  const parsed = publicLoanRequestInputSchema.safeParse({
    qrToken: formData.get("qrToken"),
    requesterName: formData.get("requesterName"),
    requesterEmail: formData.get("requesterEmail"),
    requestedDueAt: formData.get("requestedDueAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`loan-request:${ip}:${parsed.data.qrToken}`, 5, 10 * 60 * 1000)) {
    return { error: "Trop de tentatives. Veuillez réessayer dans quelques minutes." };
  }

  const asset = await getPublicAssetByQrToken(parsed.data.qrToken);
  if (!asset) {
    return { error: "Objet introuvable." };
  }

  const settings = parseOrganizationSettings(asset.organizationSettings);
  if (!settings.allowPublicLoanRequests) {
    return { error: "Les demandes autonomes sont désactivées pour cet établissement." };
  }

  try {
    const request = await createLoanRequest(
      asset.organizationId,
      asset.id,
      {
        requesterName: parsed.data.requesterName,
        requesterEmail: parsed.data.requesterEmail,
        requestedDueAt: dueDateToUtc(parsed.data.requestedDueAt, asset.organizationTimezone),
      },
      !settings.requireApprovalForLoanRequests,
    );
    redirect(`/r/${request.trackingToken}`);
  } catch (error) {
    if (error instanceof AssetNotRequestableError) {
      return { error: error.message };
    }
    throw error;
  }
}
