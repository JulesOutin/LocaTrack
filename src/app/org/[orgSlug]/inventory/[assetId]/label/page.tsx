import { notFound } from "next/navigation";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { getAssetById } from "@/lib/assets/queries";
import { generateQrCodeSvg, getPublicAssetUrl } from "@/lib/qr";
import { PrintButton } from "./print-button";

const LABELS_PER_SHEET = 10;

export default async function AssetLabelPage({
  params,
}: {
  params: Promise<{ orgSlug: string; assetId: string }>;
}) {
  const { orgSlug, assetId } = await params;
  const { organization } = await requireOrgAccessBySlug(orgSlug);

  const asset = await getAssetById(organization.id, assetId);
  if (!asset) {
    notFound();
  }

  const qrSvg = await generateQrCodeSvg(getPublicAssetUrl(asset.qrToken));

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          #label-sheet, #label-sheet * { visibility: visible; }
          #label-sheet { position: absolute; inset: 0; }
        }
      `}</style>

      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>

      <div
        id="label-sheet"
        className="grid grid-cols-2 gap-3 bg-white p-2"
      >
        {Array.from({ length: LABELS_PER_SHEET }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-md border border-slate-300 p-3"
          >
            <div
              className="size-16 shrink-0 [&_svg]:size-full"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{asset.name}</p>
              <p className="font-mono text-xs text-slate-600">{asset.assetCode}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
