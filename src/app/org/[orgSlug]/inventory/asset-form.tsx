"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ASSET_CONDITION_LABELS,
  ASSET_CONDITIONS,
  ASSET_STATUS_LABELS,
  ASSET_STATUSES,
} from "@/lib/assets/schema";
import { createAssetAction, updateAssetAction, type AssetFormState } from "./actions";

type Category = { id: string; name: string };

type AssetFormValues = {
  id?: string;
  name: string;
  assetCode: string;
  categoryId: string | null;
  serialNumber: string | null;
  condition: string;
  status: string;
  location: string | null;
  notes: string | null;
};

const initialState: AssetFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function AssetForm({
  organizationId,
  categories,
  asset,
}: {
  organizationId: string;
  categories: Category[];
  asset?: AssetFormValues;
}) {
  const action = asset ? updateAssetAction : createAssetAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      {asset?.id ? <input type="hidden" name="assetId" value={asset.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={160}
            defaultValue={asset?.name}
            placeholder="Ordinateur portable Dell Latitude"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assetCode">Référence</Label>
          <Input
            id="assetCode"
            name="assetCode"
            required
            maxLength={60}
            defaultValue={asset?.assetCode}
            placeholder="INFO-003"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Catégorie</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={asset?.categoryId ?? ""}
            className={selectClassName}
          >
            <option value="">Aucune catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Numéro de série</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            maxLength={120}
            defaultValue={asset?.serialNumber ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="condition">État</Label>
          <select
            id="condition"
            name="condition"
            defaultValue={asset?.condition ?? "good"}
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
          <Label htmlFor="status">Disponibilité</Label>
          <select
            id="status"
            name="status"
            defaultValue={asset?.status ?? "available"}
            className={selectClassName}
          >
            {ASSET_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ASSET_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Emplacement</Label>
          <Input
            id="location"
            name="location"
            maxLength={160}
            defaultValue={asset?.location ?? ""}
            placeholder="Salle informatique"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          maxLength={2000}
          defaultValue={asset?.notes ?? ""}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : asset ? "Enregistrer les modifications" : "Créer l'objet"}
      </Button>
    </form>
  );
}
