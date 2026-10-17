import Link from "next/link";
import { requireOrgAccessBySlug } from "@/lib/org-access";
import { listOrgHistory, type HistoryFilter } from "@/lib/history";
import { EVENT_LABELS, formatDateTime } from "@/lib/event-labels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TABS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "loans", label: "Prêts" },
  { value: "assets", label: "Matériel" },
];

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { orgSlug } = await params;
  const { type } = await searchParams;
  const { organization } = await requireOrgAccessBySlug(orgSlug);

  const filter: HistoryFilter = type === "loans" || type === "assets" ? type : "all";
  const entries = await listOrgHistory(organization.id, filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Historique</h1>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "secondary" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/org/${orgSlug}/history${tab.value === "all" ? "" : `?type=${tab.value}`}`}>
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li
                  key={`${entry.kind}-${entry.id}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {EVENT_LABELS[entry.eventType] ?? entry.eventType}
                    </p>
                    <p className="text-muted-foreground">
                      {entry.subject}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDateTime(entry.createdAt, organization.timezone)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
