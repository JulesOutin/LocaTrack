import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { permissions, type MembershipRole } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/role-labels";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization, membership } = await requireOrgAccessBySlug(orgSlug);
  const role = membership.role as MembershipRole;
  const canManage = permissions.manageOrganization(role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Paramètres de l&apos;organisation
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <SettingsForm
              organizationId={organization.id}
              name={organization.name}
              timezone={organization.timezone}
            />
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="font-medium text-foreground">{organization.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fuseau horaire</dt>
                <dd className="font-medium text-foreground">{organization.timezone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Votre rôle</dt>
                <dd className="font-medium text-foreground">{ROLE_LABELS[role]}</dd>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Seul le propriétaire peut modifier ces informations.
              </p>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identifiant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Identifiant d&apos;organisation :{" "}
            <span className="font-mono text-foreground">{organization.slug}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
