import {
  LayoutDashboard,
  Package,
  Handshake,
  Inbox,
  Users,
  History,
  Settings,
  QrCode,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  segment: string;
  icon: LucideIcon;
};

export const SCAN_NAV_ITEM: NavItem = {
  label: "Scanner",
  segment: "scan",
  icon: QrCode,
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", segment: "dashboard", icon: LayoutDashboard },
  { label: "Matériel", segment: "inventory", icon: Package },
  { label: "Prêts", segment: "loans", icon: Handshake },
  { label: "Demandes", segment: "requests", icon: Inbox },
  { label: "Emprunteurs", segment: "borrowers", icon: Users },
  { label: "Historique", segment: "history", icon: History },
  { label: "Paramètres", segment: "settings", icon: Settings },
];
