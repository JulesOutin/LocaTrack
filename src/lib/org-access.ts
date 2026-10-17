import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { stackServerApp } from "@/lib/stack/server";
import {
  parseOrganizationSettings,
  type OrganizationSettings,
} from "@/lib/organizations/settings";
import type { MembershipRole } from "@/lib/permissions";

export type OrgAccess = {
  user: { id: string; displayName: string | null; primaryEmail: string | null };
  organization: typeof organizations.$inferSelect;
  membership: typeof memberships.$inferSelect;
  settings: OrganizationSettings;
};

function toOrgAccess(
  row: { organizations: typeof organizations.$inferSelect; memberships: typeof memberships.$inferSelect },
  user: { id: string; displayName: string | null; primaryEmail: string | null },
): OrgAccess {
  return {
    user,
    organization: row.organizations,
    membership: row.memberships,
    settings: parseOrganizationSettings(row.organizations.settings),
  };
}

/**
 * À utiliser dans les pages/layouts : route protégée par l'URL `[orgSlug]`.
 * Redirige vers la connexion si non authentifié, 404 si l'organisation
 * n'existe pas, et vers l'accueil si l'utilisateur n'en est pas membre —
 * l'appartenance est systématiquement revérifiée en base (une seule requête
 * jointe, jamais déduite de l'URL).
 */
export async function requireOrgAccessBySlug(orgSlug: string): Promise<OrgAccess> {
  const user = await stackServerApp.getUser({ or: "redirect" });

  const [row] = await db
    .select()
    .from(organizations)
    .innerJoin(
      memberships,
      and(eq(memberships.organizationId, organizations.id), eq(memberships.userId, user.id)),
    )
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!row) {
    // On ne distingue pas "organisation inexistante" de "non membre" dans la
    // requête (même coût), mais on affine la réponse pour l'utilisateur :
    // 404 si l'organisation n'existe vraiment pas, sinon retour à l'accueil.
    const [organization] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    if (!organization) notFound();
    redirect("/");
  }

  return toOrgAccess(row, { id: user.id, displayName: user.displayName, primaryEmail: user.primaryEmail });
}

/**
 * Variante sans redirection ni exception : à utiliser dans un contexte où
 * une réponse HTTP explicite (401/403 JSON) est préférable, comme une route
 * API (ex. émission de jeton d'upload Vercel Blob).
 */
export async function getOrgAccessById(organizationId: string): Promise<OrgAccess | null> {
  const user = await stackServerApp.getUser();
  if (!user) return null;

  const [row] = await db
    .select()
    .from(organizations)
    .innerJoin(
      memberships,
      and(eq(memberships.organizationId, organizations.id), eq(memberships.userId, user.id)),
    )
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!row) return null;

  return toOrgAccess(row, { id: user.id, displayName: user.displayName, primaryEmail: user.primaryEmail });
}

/**
 * À utiliser dans les Server Actions lorsqu'un `organizationId` est
 * transmis par le client : on ne lui fait jamais confiance — l'appartenance
 * est revérifiée en base à chaque appel.
 */
export async function requireOrgAccessById(organizationId: string): Promise<OrgAccess> {
  const access = await getOrgAccessById(organizationId);
  if (!access) {
    throw new Error("Organisation introuvable ou accès non autorisé.");
  }
  return access;
}

export function requireRole(membership: { role: string }, allowed: MembershipRole[]) {
  if (!allowed.includes(membership.role as MembershipRole)) {
    throw new Error("Vous n'avez pas l'autorisation d'effectuer cette action.");
  }
}
