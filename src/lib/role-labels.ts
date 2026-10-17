import type { MembershipRole } from "@/lib/permissions";

export const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  manager: "Gestionnaire",
};
