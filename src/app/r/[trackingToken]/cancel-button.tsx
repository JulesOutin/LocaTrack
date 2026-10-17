"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelPublicLoanRequestAction, type CancelRequestState } from "./actions";

const initialState: CancelRequestState = {};

export function CancelRequestButton({ trackingToken }: { trackingToken: string }) {
  const [state, formAction, isPending] = useActionState(cancelPublicLoanRequestAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Annuler votre demande ?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="trackingToken" value={trackingToken} />
      <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
        {isPending ? "..." : "Annuler ma demande"}
      </Button>
      {state.error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
