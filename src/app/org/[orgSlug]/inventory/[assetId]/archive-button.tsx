"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { archiveAssetAction, type ArchiveAssetState } from "../actions";

const initialState: ArchiveAssetState = {};

export function ArchiveButton({
  organizationId,
  assetId,
}: {
  organizationId: string;
  assetId: string;
}) {
  const [state, formAction, isPending] = useActionState(archiveAssetAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Archiver cet objet ? Il ne pourra plus être emprunté.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="assetId" value={assetId} />
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Archivage..." : "Archiver"}
      </Button>
      {state.error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
