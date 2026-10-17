"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBorrowerAction,
  updateBorrowerAction,
  type BorrowerFormState,
} from "./actions";

const initialState: BorrowerFormState = {};

export function BorrowerForm({
  organizationId,
  borrower,
}: {
  organizationId: string;
  borrower?: { id: string; displayName: string; email: string | null; borrowerCode: string | null };
}) {
  const action = borrower ? updateBorrowerAction : createBorrowerAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      {borrower?.id ? <input type="hidden" name="borrowerId" value={borrower.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="displayName">Nom</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          maxLength={160}
          defaultValue={borrower?.displayName}
          placeholder="Camille Durand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail (facultatif)</Label>
          <Input id="email" name="email" type="email" defaultValue={borrower?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="borrowerCode">Code emprunteur (facultatif)</Label>
          <Input
            id="borrowerCode"
            name="borrowerCode"
            maxLength={60}
            defaultValue={borrower?.borrowerCode ?? ""}
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : borrower ? "Enregistrer" : "Créer l'emprunteur"}
      </Button>
    </form>
  );
}
