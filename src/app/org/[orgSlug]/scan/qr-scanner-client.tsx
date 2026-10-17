"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resolveScanInput } from "./actions";

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
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 240 }, false);

    scanner.render(
      (decodedText) => {
        void handleDecoded(decodedText);
      },
      () => {
        // Échecs de décodage image par image : ignorés volontairement (flux continu).
      },
    );

    return () => {
      scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div id="qr-reader" />
          <p className="text-xs text-muted-foreground">
            Si l&apos;accès à la caméra est refusé ou indisponible, utilisez la recherche
            manuelle ci-dessous.
          </p>
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
