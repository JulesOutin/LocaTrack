"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { setBorrowerActiveAction, type SetBorrowerActiveState } from "./actions";

const initialState: SetBorrowerActiveState = {};

export function ToggleActiveButton({
  organizationId,
  borrowerId,
  active,
}: {
  organizationId: string;
  borrowerId: string;
  active: boolean;
}) {
  const [state, formAction, isPending] = useActionState(setBorrowerActiveAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const message = active
          ? "Désactiver cet emprunteur ? Son historique sera conservé."
          : "Réactiver cet emprunteur ?";
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="borrowerId" value={borrowerId} />
      <input type="hidden" name="active" value={(!active).toString()} />
      <Button type="submit" variant={active ? "destructive" : "outline"} disabled={isPending}>
        {isPending ? "..." : active ? "Désactiver" : "Réactiver"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
