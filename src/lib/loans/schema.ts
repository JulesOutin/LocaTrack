import { z } from "zod";
import { ASSET_CONDITIONS } from "@/lib/assets/schema";
import { optionalText, optionalUuid } from "@/lib/form-fields";

export const LOAN_STATUSES = ["active", "returned", "cancelled"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: "En cours",
  returned: "Rendu",
  cancelled: "Annulé",
};

export const createLoanInputSchema = z
  .object({
    assetId: z.string().uuid(),
    borrowerId: optionalUuid(),
    newBorrowerName: optionalText(160),
    dueAt: z.string().min(1, "La date de retour est requise."),
    notes: optionalText(2000),
  })
  .refine((data) => Boolean(data.borrowerId) || Boolean(data.newBorrowerName), {
    message: "Sélectionnez un emprunteur existant ou renseignez le nom d'un nouvel emprunteur.",
    path: ["newBorrowerName"],
  });

export type CreateLoanInput = z.infer<typeof createLoanInputSchema>;

export const extendLoanInputSchema = z.object({
  loanId: z.string().uuid(),
  dueAt: z.string().min(1, "La nouvelle date de retour est requise."),
});

// Après un retour, l'objet ne peut repasser "disponible" que si son état
// constaté n'est pas endommagé (règle métier appliquée aussi côté serveur).
export const RETURN_NEXT_STATUSES = ["available", "maintenance", "unavailable"] as const;

export const returnLoanInputSchema = z.object({
  loanId: z.string().uuid(),
  condition: z.enum(ASSET_CONDITIONS),
  nextStatus: z.enum(RETURN_NEXT_STATUSES),
  incidentNote: optionalText(2000),
});

export type ReturnLoanInput = z.infer<typeof returnLoanInputSchema>;

export const cancelLoanInputSchema = z.object({
  loanId: z.string().uuid(),
});
