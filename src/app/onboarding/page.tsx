import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/stack/server";
import { findFirstMembershipOrgSlug } from "@/lib/organizations/create";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await stackServerApp.getUser({ or: "redirect" });

  const existingOrgSlug = await findFirstMembershipOrgSlug(user.id);
  if (existingOrgSlug) {
    redirect(`/org/${existingOrgSlug}/dashboard`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bienvenue sur Locatrack
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez l&apos;organisation de votre établissement pour commencer à
            gérer votre matériel.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
