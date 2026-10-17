import type { OrganizationSettings } from "@/lib/organizations/settings";

export type MembershipRole = "owner" | "admin" | "manager";

/**
 * Matrice de permissions (section 6 du cahier des charges). Toujours
 * appliquée côté serveur, dans chaque action/route — jamais seulement pour
 * masquer des boutons côté client.
 */
export const permissions = {
  manageOrganization: (role: MembershipRole) => role === "owner",
  manageMembers: (role: MembershipRole, settings: OrganizationSettings) =>
    role === "owner" || (role === "admin" && settings.adminsCanManageMembers),
  manageAssets: (role: MembershipRole) => role === "owner" || role === "admin",
  manageCategories: (role: MembershipRole) =>
    role === "owner" || role === "admin",
  manageBorrowers: (role: MembershipRole) =>
    role === "owner" || role === "admin" || role === "manager",
  // Toujours vrai pour les trois rôles aujourd'hui, mais conservé comme
  // fonction (plutôt qu'une constante) pour garder une matrice homogène et
  // pouvoir restreindre facilement un rôle plus tard.
  recordLoans: (role: MembershipRole) => ["owner", "admin", "manager"].includes(role),
  processLoanRequests: (role: MembershipRole, settings: OrganizationSettings) =>
    role === "owner" ||
    role === "admin" ||
    (role === "manager" && settings.managersCanProcessRequests),
  viewHistory: (role: MembershipRole) => ["owner", "admin", "manager"].includes(role),
  exportData: (role: MembershipRole) => role === "owner" || role === "admin",
} as const;

export class PermissionDeniedError extends Error {
  constructor(message = "Vous n'avez pas l'autorisation d'effectuer cette action.") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export function assertPermission(granted: boolean): void {
  if (!granted) {
    throw new PermissionDeniedError();
  }
}
