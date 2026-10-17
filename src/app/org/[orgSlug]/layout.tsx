import { UserButton } from "@stackframe/stack";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { OrgSidebar, OrgMobileNav } from "@/components/org-nav";
import { ROLE_LABELS } from "@/lib/role-labels";
import type { MembershipRole } from "@/lib/permissions";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);

  return (
    <div className="flex min-h-screen bg-background">
      <OrgSidebar orgSlug={orgSlug} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <div>
            <p className="text-sm font-medium text-foreground">{organization.name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[membership.role as MembershipRole]}
            </p>
          </div>
          <UserButton showUserInfo />
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-6">{children}</main>
      </div>
      <OrgMobileNav orgSlug={orgSlug} />
    </div>
  );
}
