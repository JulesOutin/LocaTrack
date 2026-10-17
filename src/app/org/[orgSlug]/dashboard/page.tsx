import { requireOrgAccessBySlug } from "@/lib/org-access";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_LABELS, formatDateTime } from "@/lib/event-labels";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization } = await requireOrgAccessBySlug(orgSlug);
  const stats = await getDashboardStats(organization.id);

  const statCards = [
    { label: "Objets au total", value: stats.totalAssets },
    { label: "Objets disponibles", value: stats.availableAssets },
    { label: "Objets empruntés", value: stats.borrowedAssets },
    { label: "Prêts en retard", value: stats.lateLoans, alert: stats.lateLoans > 0 },
    { label: "Demandes en attente", value: stats.pendingRequests },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={
                  card.alert && card.value > 0
                    ? "text-3xl font-semibold text-destructive"
                    : "text-3xl font-semibold text-foreground"
                }
              >
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prochains retours</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingReturns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun prêt actif pour le moment.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.upcomingReturns.map((item) => (
                  <li
                    key={item.loanId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.assetName}</p>
                      <p className="text-muted-foreground">{item.borrowerName}</p>
                    </div>
                    <span className="text-muted-foreground">
                      {formatDateTime(item.dueAt, organization.timezone)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernières opérations</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune opération enregistrée pour le moment.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.recentActivity.map((event) => (
                  <li key={`${event.kind}-${event.id}`} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {EVENT_LABELS[event.eventType] ?? event.eventType}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateTime(event.createdAt, organization.timezone)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
