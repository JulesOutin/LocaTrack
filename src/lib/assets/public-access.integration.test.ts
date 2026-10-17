import { describe, expect, it } from "vitest";
import { getPublicAssetByQrToken } from "@/lib/assets/queries";
import { createTestAsset, createTestOrganization } from "@/test-support/factories";

describe("accès public via QR code", () => {
  it("retourne l'objet pour un jeton valide, sans exposer de données privées", async () => {
    const org = await createTestOrganization();
    const asset = await createTestAsset(org.id, {
      notes: "Note interne confidentielle",
      location: "Armoire du bureau du directeur",
    });

    const result = await getPublicAssetByQrToken(asset.qrToken);

    expect(result?.id).toBe(asset.id);
    expect(result?.name).toBe(asset.name);
    expect(result).not.toHaveProperty("notes");
    expect(result).not.toHaveProperty("location");
    expect(result).not.toHaveProperty("serialNumber");
  });

  it("retourne null pour un jeton inconnu", async () => {
    const result = await getPublicAssetByQrToken("jeton-qui-n-existe-pas");
    expect(result).toBeNull();
  });
});
