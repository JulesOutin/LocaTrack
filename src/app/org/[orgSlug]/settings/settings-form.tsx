"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IANA_TIMEZONES } from "@/lib/timezones";
import {
  updateOrganizationSettingsAction,
  type UpdateOrgSettingsState,
} from "./actions";

const initialState: UpdateOrgSettingsState = {};

export function SettingsForm({
  organizationId,
  name,
  timezone,
}: {
  organizationId: string;
  name: string;
  timezone: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateOrganizationSettingsAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="space-y-2">
        <Label htmlFor="name">Nom de l&apos;établissement</Label>
        <Input id="name" name="name" defaultValue={name} required minLength={2} maxLength={120} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Fuseau horaire</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={timezone}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          {IANA_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600" role="status">
          Paramètres enregistrés.
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
