import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

export const borrowerInputSchema = z.object({
  displayName: z.string().trim().min(1, "Le nom est requis.").max(160),
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  borrowerCode: optionalText(60),
});

export type BorrowerInput = z.infer<typeof borrowerInputSchema>;

export const quickBorrowerInputSchema = z.object({
  displayName: z.string().trim().min(1, "Le nom de l'emprunteur est requis.").max(160),
});
