"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { setAssetPhotoAction } from "../actions";

export function PhotoUpload({
  organizationId,
  assetId,
  initialPhotoUrl,
}: {
  organizationId: string;
  assetId: string;
  initialPhotoUrl: string | null;
}) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const pathname = `assets/${organizationId}/${assetId}-${Date.now()}-${file.name}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        clientPayload: JSON.stringify({ organizationId }),
      });

      const result = await setAssetPhotoAction(organizationId, assetId, blob.url);
      if (result.error) {
        setError(result.error);
      } else {
        setPhotoUrl(result.photoUrl ?? blob.url);
      }
    } catch {
      setError("L'envoi de la photo a échoué. Vérifiez le type et la taille du fichier (5 Mo max).");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {photoUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border">
          <Image src={photoUrl} alt="Photo de l'objet" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune photo pour le moment.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="photo-input"
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Envoi en cours..." : photoUrl ? "Changer la photo" : "Ajouter une photo"}
      </Button>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
