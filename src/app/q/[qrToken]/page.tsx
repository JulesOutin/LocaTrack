import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicAssetByQrToken } from "@/lib/assets/queries";
import { ASSET_STATUS_LABELS, type AssetStatus } from "@/lib/assets/schema";
import { parseOrganizationSettings } from "@/lib/organizations/settings";
import { RequestForm } from "./request-form";

export default async function PublicAssetPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  const asset = await getPublicAssetByQrToken(qrToken);

  if (!asset) {
    notFound();
  }

  const settings = parseOrganizationSettings(asset.organizationSettings);
  const isRequestable = asset.status === "available" || asset.status === "unavailable";
  const canRequest = settings.allowPublicLoanRequests && isRequestable;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Locatrack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{asset.organizationName}</p>
          <p className="text-lg font-semibold text-foreground">{asset.name}</p>
          <Badge variant={asset.status === "available" ? "secondary" : "outline"} className="text-sm">
            {ASSET_STATUS_LABELS[asset.status as AssetStatus]}
          </Badge>

          {canRequest ? (
            <RequestForm qrToken={qrToken} />
          ) : (
            <p className="pt-2 text-sm text-muted-foreground">
              {settings.allowPublicLoanRequests
                ? "Cet objet ne peut pas faire l'objet d'une demande pour le moment."
                : "Les demandes de prêt en ligne ne sont pas activées pour cet établissement."}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
