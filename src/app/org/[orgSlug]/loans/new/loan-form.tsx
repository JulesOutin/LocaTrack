"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLoanAction, type LoanFormState } from "../actions";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const initialState: LoanFormState = {};

type AssetOption = { id: string; name: string; assetCode: string };
type BorrowerOption = { id: string; displayName: string };

function defaultDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function LoanForm({
  organizationId,
  assets,
  borrowers,
  defaultAssetId,
  defaultLoanDurationDays,
}: {
  organizationId: string;
  assets: AssetOption[];
  borrowers: BorrowerOption[];
  defaultAssetId?: string;
  defaultLoanDurationDays: number;
}) {
  const [state, formAction, isPending] = useActionState(createLoanAction, initialState);
  const [useNewBorrower, setUseNewBorrower] = useState(borrowers.length === 0);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="space-y-2">
        <Label htmlFor="assetId">Matériel</Label>
        <select
          id="assetId"
          name="assetId"
          required
          defaultValue={defaultAssetId ?? ""}
          className={selectClassName}
        >
          <option value="" disabled>
            Sélectionner un objet disponible
          </option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({asset.assetCode})
            </option>
          ))}
        </select>
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun objet disponible actuellement.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Emprunteur</Label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setUseNewBorrower((value) => !value)}
          >
            {useNewBorrower ? "Choisir un emprunteur existant" : "Nouvel emprunteur"}
          </button>
        </div>
        {useNewBorrower ? (
          <Input name="newBorrowerName" placeholder="Nom de l'emprunteur" maxLength={160} />
        ) : (
          <select name="borrowerId" defaultValue="" className={selectClassName}>
            <option value="" disabled>
              Sélectionner un emprunteur
            </option>
            {borrowers.map((borrower) => (
              <option key={borrower.id} value={borrower.id}>
                {borrower.displayName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueAt">Date de retour prévue</Label>
        <Input
          id="dueAt"
          name="dueAt"
          type="date"
          required
          defaultValue={defaultDueDate(defaultLoanDurationDays)}
          min={defaultDueDate(0)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Commentaire (facultatif)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending || assets.length === 0}>
        {isPending ? "Enregistrement..." : "Enregistrer le prêt"}
      </Button>
    </form>
  );
}
