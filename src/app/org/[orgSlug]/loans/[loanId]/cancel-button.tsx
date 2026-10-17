"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelLoanAction, type LoanFormState } from "../actions";

const initialState: LoanFormState = {};

export function CancelButton({
  organizationId,
  loanId,
}: {
  organizationId: string;
  loanId: string;
}) {
  const [state, formAction, isPending] = useActionState(cancelLoanAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Annuler ce prêt ? L'objet redeviendra disponible.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="loanId" value={loanId} />
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "..." : "Annuler le prêt"}
      </Button>
      {state.error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
