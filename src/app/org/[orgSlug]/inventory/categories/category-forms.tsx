"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  deleteCategoryAction,
  type CategoryFormState,
} from "../actions";

const initialState: CategoryFormState = {};

export function CreateCategoryForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="space-y-1">
        <Label htmlFor="category-name">Nom</Label>
        <Input id="category-name" name="name" required maxLength={120} placeholder="Informatique" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="category-description">Description (facultative)</Label>
        <Input id="category-description" name="description" maxLength={500} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Ajout..." : "Ajouter"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive sm:col-span-3" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function DeleteCategoryButton({
  organizationId,
  categoryId,
}: {
  organizationId: string;
  categoryId: string;
}) {
  const [state, formAction, isPending] = useActionState(deleteCategoryAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Supprimer cette catégorie ?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
        Supprimer
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
