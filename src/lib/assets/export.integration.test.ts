import { describe, expect, it } from "vitest";
import { listAllAssetsForExport } from "@/lib/assets/queries";
import { createTestAsset, createTestOrganization } from "@/test-support/factories";

describe("export CSV de l'inventaire", () => {
  it("respecte strictement le périmètre de l'organisation", async () => {
    const orgA = await createTestOrganization();
    const orgB = await createTestOrganization();
    await createTestAsset(orgA.id, { name: "Objet A" });
    await createTestAsset(orgB.id, { name: "Objet B" });

    const exportA = await listAllAssetsForExport(orgA.id, {});

    expect(exportA.some((row) => row.name === "Objet A")).toBe(true);
    expect(exportA.some((row) => row.name === "Objet B")).toBe(false);
  });

  it("applique les mêmes filtres que la liste (ex. statut)", async () => {
    const org = await createTestOrganization();
    await createTestAsset(org.id, { name: "Disponible", status: "available" });
    await createTestAsset(org.id, { name: "En maintenance", status: "maintenance" });

    const exportRows = await listAllAssetsForExport(org.id, { status: "maintenance" });

    expect(exportRows).toHaveLength(1);
    expect(exportRows[0].name).toBe("En maintenance");
  });
});
