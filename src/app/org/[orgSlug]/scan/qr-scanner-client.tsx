"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resolveScanInput } from "./actions";

const SCAN_CONFIG = { fps: 10, qrbox: 240 };
const ELEMENT_ID = "qr-reader";

export function QrScannerClient({
  organizationId,
  orgSlug,
}: {
  organizationId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [manualValue, setManualValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const handledRef = useRef(false);

  async function handleDecoded(rawValue: string) {
    if (!rawValue.trim() || handledRef.current) return;
    handledRef.current = true;
    setError(null);
    setIsResolving(true);

    const result = await resolveScanInput(organizationId, rawValue);

    if ("error" in result) {
      setError(result.error);
      handledRef.current = false;
      setIsResolving(false);
      return;
    }

    router.push(`/org/${orgSlug}/inventory/${result.assetId}`);
  }

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(ELEMENT_ID);
    let isMounted = true;

    const onSuccess = (decodedText: string) => {
      void handleDecoded(decodedText);
    };
    const onFailure = () => {
      // Échecs de décodage image par image : ignorés volontairement (flux continu).
    };

    // Caméra arrière explicite d'abord (la plus fiable sur mobile). Certains
    // appareils rejettent la contrainte "environment" (OverconstrainedError) :
    // on retente alors sans contrainte de caméra plutôt que d'abandonner.
    html5Qrcode
      .start({ facingMode: "environment" }, SCAN_CONFIG, onSuccess, onFailure)
      .catch(() => html5Qrcode.start({}, SCAN_CONFIG, onSuccess, onFailure))
      .catch((err: unknown) => {
        if (!isMounted) return;
        // getUserMedia rejette avec un DOMException, qui n'est pas une
        // instance d'Error dans les navigateurs — on lit `.name` directement.
        const name = (err as { name?: string } | undefined)?.name;
        setCameraError(
          name === "NotAllowedError"
            ? "Accès à la caméra refusé. Autorisez-la dans les paramètres du navigateur, ou utilisez la recherche manuelle ci-dessous."
            : "Impossible d'accéder à la caméra sur cet appareil. Utilisez la recherche manuelle ci-dessous.",
        );
      });

    return () => {
      isMounted = false;
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(() => {}).finally(() => html5Qrcode.clear());
      } else {
        html5Qrcode.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div
            id={ELEMENT_ID}
            className="aspect-square w-full overflow-hidden rounded-md bg-black [&_video]:w-full"
          />
          {cameraError ? (
            <p className="text-sm text-destructive" role="alert">
              {cameraError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Si l&apos;accès à la caméra est refusé ou indisponible, utilisez la recherche
              manuelle ci-dessous.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Label htmlFor="manual-code">Référence de l&apos;objet</Label>
          <div className="flex gap-2">
            <Input
              id="manual-code"
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="INFO-001"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleDecoded(manualValue);
                }
              }}
            />
            <Button disabled={isResolving || !manualValue.trim()} onClick={() => handleDecoded(manualValue)}>
              Rechercher
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
