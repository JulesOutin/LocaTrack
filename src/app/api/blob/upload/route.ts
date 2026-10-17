import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getOrgAccessById } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const clientPayload = clientPayloadRaw ? JSON.parse(clientPayloadRaw) : null;
        const organizationId = clientPayload?.organizationId;

        if (typeof organizationId !== "string") {
          throw new Error("Requête d'upload invalide.");
        }

        // Le client propose un chemin préfixé par son organisation ; on le
        // revalide côté serveur plutôt que de lui faire confiance.
        if (!pathname.startsWith(`assets/${organizationId}/`)) {
          throw new Error("Chemin d'upload invalide pour cette organisation.");
        }

        const access = await getOrgAccessById(organizationId);
        if (!access || !permissions.manageAssets(access.membership.role as MembershipRole)) {
          throw new Error("Vous n'avez pas l'autorisation d'ajouter une photo.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Échec de l'upload." },
      { status: 400 },
    );
  }
}
