"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_TIMEZONE, IANA_TIMEZONES } from "@/lib/timezones";
import { createOrganizationAction, type CreateOrganizationFormState } from "./actions";

const initialState: CreateOrganizationFormState = {};

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    createOrganizationAction,
    initialState,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;établissement</Label>
            <Input
              id="name"
              name="name"
              placeholder="Lycée Jean Moulin"
              required
              minLength={2}
              maxLength={120}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={DEFAULT_TIMEZONE}
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création en cours..." : "Créer mon organisation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
