import { z } from "zod";
import { optionalText } from "@/lib/form-fields";

export const LOAN_REQUEST_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type LoanRequestStatus = (typeof LOAN_REQUEST_STATUSES)[number];

export const LOAN_REQUEST_STATUS_LABELS: Record<LoanRequestStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

export const publicLoanRequestInputSchema = z.object({
  qrToken: z.string().min(1),
  requesterName: z.string().trim().min(1, "Votre nom est requis.").max(160),
  requesterEmail: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .nullish()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  requestedDueAt: z.string().min(1, "La date de retour souhaitée est requise."),
});

export const reviewLoanRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  reviewNote: optionalText(1000),
});
