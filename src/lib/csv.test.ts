import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("renders a simple CSV with CRLF line endings", () => {
    const csv = toCsv(["Nom", "Référence"], [["Ordinateur", "INFO-001"]]);
    expect(csv).toContain("Nom,Référence\r\nOrdinateur,INFO-001");
  });

  it("quotes cells containing commas, quotes or newlines", () => {
    const csv = toCsv(["Notes"], [['Contient une "citation", et une virgule']]);
    expect(csv).toContain('"Contient une ""citation"", et une virgule"');
  });

  it("neutralizes formula-injection payloads by prefixing a single quote", () => {
    // Payloads sans virgule/guillemet/retour à la ligne, pour isoler la
    // protection anti-formule du comportement de citation CSV standard
    // (déjà couvert par le test précédent).
    const payloads = ["=1+1", "+1+1", "-1+1", "@cmd", "\tmalicious"];
    const csv = toCsv(["Nom"], payloads.map((p) => [p]));
    for (const payload of payloads) {
      expect(csv).toContain(`'${payload}`);
    }
  });

  it("leaves ordinary text and null values untouched", () => {
    const csv = toCsv(["Nom", "Notes"], [["Objet normal", null]]);
    expect(csv).toContain("Objet normal,");
  });

  it("starts with a UTF-8 BOM for correct accented display in Excel", () => {
    const csv = toCsv(["Nom"], [["Café"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
