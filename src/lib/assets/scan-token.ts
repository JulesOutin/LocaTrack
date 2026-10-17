/** Extrait un jeton de QR code à partir d'une URL complète scannée, ou renvoie la saisie brute. */
export function extractTokenFromScan(rawInput: string): string {
  const trimmed = rawInput.trim();
  const marker = "/q/";
  const index = trimmed.lastIndexOf(marker);
  if (index === -1) return trimmed;
  return trimmed.slice(index + marker.length).split(/[/?#]/)[0];
}
