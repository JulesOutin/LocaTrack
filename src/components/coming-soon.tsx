import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">Fonctionnalité à venir</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cet écran sera implémenté en {phase}, conformément à l&apos;ordre de
            réalisation du projet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
