import "server-only";
import QRCode from "qrcode";

export function getPublicAssetUrl(qrToken: string): string {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/q/${qrToken}`;
}

/** SVG inline (chaîne de balisage), généré côté serveur — jamais à partir de données utilisateur non maîtrisées. */
export async function generateQrCodeSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 220,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });
}
