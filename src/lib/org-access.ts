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

async function loadOrgAccess(
  organization: typeof organizations.$inferSelect | undefined,
  userId: string,
): Promise<OrgAccess | null> {
  if (!organization) return null;

  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organization.id),
        eq(memberships.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) return null;

  return {
    user: { id: userId, displayName: null, primaryEmail: null },
    organization,
    membership,
    settings: parseOrganizationSettings(organization.settings),
  };
}

/**
 * À utiliser dans les pages/layouts : route protégée par l'URL `[orgSlug]`.
 * Redirige vers la connexion si non authentifié, 404 si l'organisation
 * n'existe pas, et vers l'accueil si l'utilisateur n'en est pas membre —
 * l'appartenance est systématiquement revérifiée en base, jamais déduite de
 * l'URL.
 */
export async function requireOrgAccessBySlug(orgSlug: string): Promise<OrgAccess> {
  const user = await stackServerApp.getUser({ or: "redirect" });

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!organization) {
    notFound();
  }

  const access = await loadOrgAccess(organization, user.id);
  if (!access) {
    redirect("/");
  }

  access.user.displayName = user.displayName;
  access.user.primaryEmail = user.primaryEmail;
  return access;
}

/**
 * Variante sans redirection ni exception : à utiliser dans un contexte où
 * une réponse HTTP explicite (401/403 JSON) est préférable, comme une route
 * API (ex. émission de jeton d'upload Vercel Blob).
 */
export async function getOrgAccessById(organizationId: string): Promise<OrgAccess | null> {
  const user = await stackServerApp.getUser();
  if (!user) return null;

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  const access = await loadOrgAccess(organization, user.id);
  if (!access) return null;

  access.user.displayName = user.displayName;
  access.user.primaryEmail = user.primaryEmail;
  return access;
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
