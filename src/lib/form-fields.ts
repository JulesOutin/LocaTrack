import { z } from "zod";

/**
 * Champ texte optionnel issu d'un <input>/<textarea> de formulaire HTML.
 * `FormData.get()` renvoie `null` (pas `undefined`) pour un champ absent —
 * par ex. un champ masqué par un bascule côté client (voir le formulaire de
 * prêt : emprunteur existant vs nouvel emprunteur). D'où `.nullish()` et non
 * `.optional()`, qui ne couvre que `undefined`.
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

export const optionalUuid = () =>
  z
    .string()
    .uuid()
    .nullish()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
