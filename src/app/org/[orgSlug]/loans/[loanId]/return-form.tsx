"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ASSET_CONDITION_LABELS,
  ASSET_CONDITIONS,
  ASSET_STATUS_LABELS,
} from "@/lib/assets/schema";
import { RETURN_NEXT_STATUSES } from "@/lib/loans/schema";
import { returnLoanAction, type LoanFormState } from "../actions";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const initialState: LoanFormState = {};

export function ReturnForm({
  organizationId,
  loanId,
}: {
  organizationId: string;
  loanId: string;
}) {
  const [state, formAction, isPending] = useActionState(returnLoanAction, initialState);
  const [condition, setCondition] = useState<string>("good");

  const availableNextStatuses =
    condition === "damaged"
      ? RETURN_NEXT_STATUSES.filter((status) => status !== "available")
      : RETURN_NEXT_STATUSES;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="loanId" value={loanId} />

      <div className="space-y-2">
        <Label htmlFor="condition">État constaté</Label>
        <select
          id="condition"
          name="condition"
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
          className={selectClassName}
        >
          {ASSET_CONDITIONS.map((value) => (
            <option key={value} value={value}>
              {ASSET_CONDITION_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextStatus">Disponibilité après retour</Label>
        <select
          id="nextStatus"
          name="nextStatus"
          defaultValue={availableNextStatuses[0]}
          className={selectClassName}
        >
          {availableNextStatuses.map((status) => (
            <option key={status} value={status}>
              {ASSET_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        {condition === "damaged" ? (
          <p className="text-xs text-muted-foreground">
            Un objet endommagé ne peut pas redevenir disponible automatiquement.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="incidentNote">Commentaire ou signalement d&apos;incident (facultatif)</Label>
        <textarea
          id="incidentNote"
          name="incidentNote"
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer le retour"}
      </Button>
    </form>
  );
}
