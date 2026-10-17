"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPublicLoanRequestAction, type PublicLoanRequestState } from "./actions";

const initialState: PublicLoanRequestState = {};

function defaultDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function RequestForm({ qrToken }: { qrToken: string }) {
  const [state, formAction, isPending] = useActionState(submitPublicLoanRequestAction, initialState);

  return (
    <form action={formAction} className="w-full space-y-4 text-left">
      <input type="hidden" name="qrToken" value={qrToken} />

      <div className="space-y-1.5">
        <Label htmlFor="requesterName">Votre nom</Label>
        <Input id="requesterName" name="requesterName" required maxLength={160} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requesterEmail">E-mail (facultatif)</Label>
        <Input id="requesterEmail" name="requesterEmail" type="email" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requestedDueAt">Date de retour souhaitée</Label>
        <Input
          id="requestedDueAt"
          name="requestedDueAt"
          type="date"
          required
          defaultValue={defaultDate(7)}
          min={defaultDate(0)}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Envoi..." : "Soumettre la demande"}
      </Button>
    </form>
  );
}
