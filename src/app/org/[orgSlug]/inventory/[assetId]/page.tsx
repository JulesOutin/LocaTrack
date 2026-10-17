import Link from "next/link";
import { notFound } from "next/navigation";
import { Handshake, Pencil, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import {
  getAssetById,
  getAssetEventHistory,
  getAssetLoanHistory,
} from "@/lib/assets/queries";
import {
  ASSET_CONDITION_LABELS,
  ASSET_STATUS_LABELS,
  type AssetCondition,
  type AssetStatus,
} from "@/lib/assets/schema";
import { LOAN_STATUS_LABELS, type LoanStatus } from "@/lib/loans/schema";
import { EVENT_LABELS, formatDateTime } from "@/lib/event-labels";
import { generateQrCodeSvg, getPublicAssetUrl } from "@/lib/qr";
import { ArchiveButton } from "./archive-button";
import { PhotoUpload } from "./photo-upload";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; assetId: string }>;
}) {
  const { orgSlug, assetId } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);
  const role = membership.role as MembershipRole;

  const asset = await getAssetById(organization.id, assetId);
  if (!asset) {
    notFound();
  }

  const [events, loanHistory] = await Promise.all([
    getAssetEventHistory(organization.id, assetId),
    getAssetLoanHistory(organization.id, assetId),
  ]);

  const publicUrl = getPublicAssetUrl(asset.qrToken);
  const qrSvg = await generateQrCodeSvg(publicUrl);
  const canManage = permissions.manageAssets(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{asset.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{asset.assetCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {asset.status === "available" && permissions.recordLoans(role) ? (
            <Button asChild>
              <Link href={`/org/${orgSlug}/loans/new?assetId=${asset.id}`}>
                <Handshake className="size-4" aria-hidden />
                Prêter
              </Link>
            </Button>
          ) : null}
          {canManage ? (
            <>
              <Button variant="outline" asChild>
                <Link href={`/org/${orgSlug}/inventory/${asset.id}/label`}>
                  <Printer className="size-4" aria-hidden />
                  Étiquette
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/org/${orgSlug}/inventory/${asset.id}/edit`}>
                  <Pencil className="size-4" aria-hidden />
                  Modifier
                </Link>
              </Button>
              {asset.status !== "archived" ? (
                <ArchiveButton organizationId={organization.id} assetId={asset.id} />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Disponibilité</dt>
                <dd>
                  <Badge variant="secondary">
                    {ASSET_STATUS_LABELS[asset.status as AssetStatus]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">État</dt>
                <dd className="font-medium text-foreground">
                  {ASSET_CONDITION_LABELS[asset.condition as AssetCondition]}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Catégorie</dt>
                <dd className="font-medium text-foreground">{asset.categoryName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Numéro de série</dt>
                <dd className="font-medium text-foreground">{asset.serialNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Emplacement</dt>
                <dd className="font-medium text-foreground">{asset.location ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Créé le</dt>
                <dd className="font-medium text-foreground">{formatDateTime(asset.createdAt, organization.timezone)}</dd>
              </div>
              {asset.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium text-foreground whitespace-pre-wrap">{asset.notes}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div
              className="[&_svg]:size-full"
              role="img"
              aria-label={`QR code de l'objet ${asset.name}`}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="text-center text-xs break-all text-muted-foreground">{publicUrl}</p>
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUpload
              organizationId={organization.id}
              assetId={asset.id}
              initialPhotoUrl={asset.photoUrl}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Historique des prêts</CardTitle>
          </CardHeader>
          <CardContent>
            {loanHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun prêt enregistré.</p>
            ) : (
              <ul className="space-y-3">
                {loanHistory.map((loan) => (
                  <li key={loan.id} className="flex justify-between text-sm">
                    <div>
                      <Link
                        href={`/org/${orgSlug}/loans/${loan.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {loan.borrowerName}
                      </Link>
                      <p className="text-muted-foreground">
                        {formatDateTime(loan.loanedAt, organization.timezone)} →{" "}
                        {formatDateTime(loan.dueAt, organization.timezone)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {LOAN_STATUS_LABELS[loan.status as LoanStatus]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des changements d&apos;état</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
            ) : (
              <ul className="space-y-3">
                {events.map((event) => (
                  <li key={event.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {EVENT_LABELS[event.eventType] ?? event.eventType}
                    </span>
                    <span className="text-muted-foreground">{formatDateTime(event.createdAt, organization.timezone)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
