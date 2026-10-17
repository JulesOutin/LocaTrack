import { randomBytes } from "node:crypto";

/**
 * Jeton aléatoire non devinable (encodage base64url), utilisé pour les QR
 * codes d'objets et les liens de suivi de demande. Jamais dérivé d'un
 * identifiant interne prévisible.
 */
export function generateSecureToken(bytes = 20): string {
  return randomBytes(bytes).toString("base64url");
}
