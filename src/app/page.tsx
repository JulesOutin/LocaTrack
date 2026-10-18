import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/stack/server";
import { findFirstMembershipOrgSlug } from "@/lib/organizations/create";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function HomePage() {
  const user = await stackServerApp.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const orgSlug = await findFirstMembershipOrgSlug(user.id);

  if (!orgSlug) {
    redirect("/onboarding");
  }

  redirect(`/org/${orgSlug}/dashboard`);
}
