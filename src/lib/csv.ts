// Protection contre l'injection de formules dans les cellules CSV (OWASP) :
// toute valeur commençant par =, +, -, @, tabulation ou retour chariot est
// préfixée d'une apostrophe pour empêcher son interprétation comme formule
// par un tableur (Excel, LibreOffice, Google Sheets).
const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function sanitizeCsvCell(value: string): string {
  let cell = value;
  if (DANGEROUS_PREFIXES.some((prefix) => cell.startsWith(prefix))) {
    cell = `'${cell}`;
  }
  if (/["\n,]/.test(cell)) {
    cell = `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null>>): string {
  const lines = [headers.map(sanitizeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map((cell) => sanitizeCsvCell(cell === null ? "" : String(cell))).join(","));
  }
  // BOM UTF-8 pour un affichage correct des accents dans Excel.
  return `﻿${lines.join("\r\n")}`;
}
