import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  History,
  FileDown,
  ShieldCheck,
  Smartphone,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: Boxes,
    title: "Inventaire centralisé",
    description:
      "Ordinateurs, vidéoprojecteurs, caméras, matériel pédagogique ou sportif : une fiche par objet, avec état, emplacement et historique complet.",
  },
  {
    icon: QrCode,
    title: "QR codes & étiquettes",
    description:
      "Chaque objet reçoit un QR code unique, prêt à imprimer au format A4, pour identifier et retrouver le matériel en un scan.",
  },
  {
    icon: ClipboardList,
    title: "Prêts & retours",
    description:
      "Enregistrez un prêt, fixez une date de retour, prolongez ou clôturez en quelques clics. La disponibilité se met à jour immédiatement.",
  },
  {
    icon: Smartphone,
    title: "Demandes autonomes",
    description:
      "Un emprunteur scanne le QR code et demande le matériel depuis son téléphone, sans créer de compte. Vous approuvez ou refusez.",
  },
  {
    icon: LayoutDashboard,
    title: "Tableau de bord en temps réel",
    description:
      "Objets disponibles, prêts en retard, demandes en attente, prochains retours : une vue d'ensemble toujours à jour.",
  },
  {
    icon: History,
    title: "Historique & traçabilité",
    description:
      "Chaque création, prêt, retour ou changement d'état est journalisé, pour savoir qui a fait quoi et quand.",
  },
  {
    icon: FileDown,
    title: "Exports CSV",
    description:
      "Exportez l'inventaire ou les prêts filtrés, pour vos tableaux de bord ou votre comptabilité de matériel.",
  },
  {
    icon: ShieldCheck,
    title: "Rôles & permissions",
    description:
      "Propriétaire, administrateur ou gestionnaire : chaque membre n'accède qu'aux actions autorisées pour son établissement.",
  },
];

const STEPS = [
  {
    icon: QrCode,
    title: "Scannez",
    description:
      "Collez l'étiquette sur l'objet. Un scan à la caméra du téléphone ouvre sa fiche, sans application à installer.",
  },
  {
    icon: ClipboardList,
    title: "Empruntez",
    description:
      "Le gestionnaire enregistre le prêt à un emprunteur, ou valide une demande déposée directement depuis le scan.",
  },
  {
    icon: Camera,
    title: "Retrouvez",
    description:
      "Disponibilité, emplacement et historique restent à jour pour tout le monde, à tout moment.",
  },
];

const AUDIENCE = [
  "Écoles et lycées",
  "Centres de formation",
  "Organismes de formation",
  "Établissements avec matériel partagé",
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <span className="font-heading text-lg font-semibold text-foreground">
            Locatrack
          </span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnalites" className="hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#comment-ca-marche" className="hover:text-foreground">
              Comment ça marche
            </a>
            <a href="#pour-qui" className="hover:text-foreground">
              Pour qui ?
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/handler/sign-in">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/handler/sign-up">
                Créer un compte
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center md:px-6">
          <Badge variant="secondary" className="mx-auto">
            Pour les établissements scolaires et centres de formation
          </Badge>
          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Scannez. Empruntez. Retrouvez.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Locatrack permet à votre établissement de savoir en un instant quel
            matériel est disponible, qui l&apos;a emprunté et quand il doit être
            rendu, sans tableur complexe ni logiciel de gestion de parc lourd.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/handler/sign-up">
                Créer mon établissement
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/handler/sign-in">J&apos;ai déjà un compte</Link>
            </Button>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl ring-1 ring-foreground/10 sm:grid-cols-4">
            {[
              { label: "Objets suivis", value: "Illimités" },
              { label: "Prêt en retard détecté", value: "Automatique" },
              { label: "Compte emprunteur requis", value: "Aucun" },
              { label: "Interface", value: "100% en français" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card p-4 text-left">
                <p className="font-heading text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comment-ca-marche" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <div className="text-center">
              <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
                Comment ça marche
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Trois étapes, du matériel posé sur l&apos;étagère au prêt enregistré.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <Card key={step.title}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <step.icon className="size-4.5" />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Étape {index + 1}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{step.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
              Tout ce qu&apos;il faut pour gérer votre matériel
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Une application pensée pour les gestionnaires de matériel, pas pour
              les experts logiciel.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} size="sm">
                <CardHeader>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-4.5" />
                  </span>
                  <CardTitle className="mt-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pour-qui" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
                  Conçu pour le matériel partagé
                </h2>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  Locatrack s&apos;adresse à tout établissement qui prête du
                  matériel à plusieurs personnes et doit en garder la trace.
                </p>
                <ul className="mt-6 space-y-3">
                  {AUDIENCE.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
                  Une organisation par établissement
                </h2>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  Chaque établissement dispose de son propre espace, isolé des
                  autres : ses objets, ses emprunteurs, ses prêts et son
                  historique. Les permissions sont vérifiées côté serveur à
                  chaque action, pour chaque rôle.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
            Prêt à essayer Locatrack ?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Créez votre établissement, ajoutez votre premier objet et générez
            son QR code en quelques minutes.
          </p>
          <div className="mt-6">
            <Button size="lg" asChild>
              <Link href="/handler/sign-up">
                Commencer gratuitement
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground md:flex-row md:px-6">
          <span>© {new Date().getFullYear()} Locatrack</span>
          <span>Scannez. Empruntez. Retrouvez.</span>
        </div>
      </footer>
    </div>
  );
}
