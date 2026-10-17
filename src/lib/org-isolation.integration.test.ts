import { describe, expect, it } from "vitest";
import { getAssetById, listAssets } from "@/lib/assets/queries";
import { createTestAsset, createTestOrganization } from "@/test-support/factories";

describe("isolation entre organisations", () => {
  it("getAssetById ne retourne jamais l'objet d'une autre organisation", async () => {
    const orgA = await createTestOrganization();
    const orgB = await createTestOrganization();
    const assetA = await createTestAsset(orgA.id, { name: "Ordinateur A" });

    const foundFromOwnOrg = await getAssetById(orgA.id, assetA.id);
    expect(foundFromOwnOrg?.id).toBe(assetA.id);

    const foundFromOtherOrg = await getAssetById(orgB.id, assetA.id);
    expect(foundFromOtherOrg).toBeNull();
  });

  it("listAssets ne mélange jamais les objets de deux organisations", async () => {
    const orgA = await createTestOrganization();
    const orgB = await createTestOrganization();
    await createTestAsset(orgA.id, { name: "Objet exclusif A" });
    await createTestAsset(orgB.id, { name: "Objet exclusif B" });

    const resultA = await listAssets(orgA.id, {});
    const resultB = await listAssets(orgB.id, {});

    expect(resultA.assets.some((a) => a.name === "Objet exclusif A")).toBe(true);
    expect(resultA.assets.some((a) => a.name === "Objet exclusif B")).toBe(false);

    expect(resultB.assets.some((a) => a.name === "Objet exclusif B")).toBe(true);
    expect(resultB.assets.some((a) => a.name === "Objet exclusif A")).toBe(false);
  });
});
