import { z } from "zod";

export const ASSET_CONDITIONS = ["good", "worn", "damaged"] as const;
export const ASSET_STATUSES = ["available", "unavailable", "maintenance", "archived"] as const;

export type AssetCondition = (typeof ASSET_CONDITIONS)[number];
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
  good: "Bon état",
  worn: "Usé",
  damaged: "Endommagé",
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  available: "Disponible",
  unavailable: "Indisponible",
  maintenance: "En maintenance",
  archived: "Archivé",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

export const assetInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(160),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  assetCode: z.string().trim().min(1, "La référence est requise.").max(60),
  serialNumber: optionalText(120),
  condition: z.enum(ASSET_CONDITIONS),
  status: z.enum(ASSET_STATUSES),
  location: optionalText(160),
  notes: optionalText(2000),
});

export type AssetInput = z.infer<typeof assetInputSchema>;
