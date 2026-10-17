"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extendLoanAction, type LoanFormState } from "../actions";

const initialState: LoanFormState = {};

export function ExtendForm({
  organizationId,
  loanId,
  currentDueDate,
}: {
  organizationId: string;
  loanId: string;
  currentDueDate: string;
}) {
  const [state, formAction, isPending] = useActionState(extendLoanAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="loanId" value={loanId} />
      <Input type="date" name="dueAt" defaultValue={currentDueDate} min={currentDueDate} required />
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "..." : "Prolonger"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
