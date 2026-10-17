"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { approveLoanRequestAction, rejectLoanRequestAction, type ReviewRequestState } from "./actions";

const initialState: ReviewRequestState = {};

export function ApproveButton({
  organizationId,
  requestId,
}: {
  organizationId: string;
  requestId: string;
}) {
  const [state, formAction, isPending] = useActionState(approveLoanRequestAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "..." : "Approuver"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function RejectForm({
  organizationId,
  requestId,
}: {
  organizationId: string;
  requestId: string;
}) {
  const [state, formAction, isPending] = useActionState(rejectLoanRequestAction, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Refuser
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="requestId" value={requestId} />
      <textarea
        name="reviewNote"
        placeholder="Motif du refus (facultatif)"
        rows={2}
        maxLength={1000}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
          {isPending ? "..." : "Confirmer le refus"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
      {state.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
