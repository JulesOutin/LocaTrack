import { requireOrgAccessBySlug } from "@/lib/org-access";
import { QrScannerClient } from "./qr-scanner-client";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization } = await requireOrgAccessBySlug(orgSlug);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Scanner un QR code
      </h1>
      <QrScannerClient organizationId={organization.id} orgSlug={orgSlug} />
    </div>
  );
}
