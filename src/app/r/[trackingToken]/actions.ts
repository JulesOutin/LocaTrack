"use server";

import { revalidatePath } from "next/cache";
import { cancelLoanRequestByTrackingToken, RequestNotPendingError } from "@/lib/loan-requests/mutations";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export type CancelRequestState = { error?: string };

export async function cancelPublicLoanRequestAction(
  _prevState: CancelRequestState,
  formData: FormData,
): Promise<CancelRequestState> {
  const trackingToken = String(formData.get("trackingToken") ?? "");

  const ip = await getClientIp();
  if (!checkRateLimit(`cancel-request:${ip}:${trackingToken}`, 10, 10 * 60 * 1000)) {
    return { error: "Trop de tentatives. Veuillez réessayer dans quelques minutes." };
  }

  try {
    await cancelLoanRequestByTrackingToken(trackingToken);
  } catch (error) {
    if (error instanceof RequestNotPendingError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/r/${trackingToken}`);
  return {};
}
