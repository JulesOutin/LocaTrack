import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Identité des utilisateurs : gérée par Neon Auth (Stack Auth), synchronisée
// automatiquement dans la table `neon_auth.users_sync` (id, name, email, ...).
// On ne duplique pas cette table ici ; `membership.userId` référence son `id`
// (texte) sans contrainte de clé étrangère inter-schéma — l'existence de
// l'utilisateur est garantie par la session Stack Auth côté serveur.

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "manager",
]);

export const assetConditionEnum = pgEnum("asset_condition", [
  "good",
  "worn",
  "damaged",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "available",
  "unavailable",
  "maintenance",
  "archived",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "returned",
  "cancelled",
]);

export const loanRequestStatusEnum = pgEnum("loan_request_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  timezone: text("timezone").notNull().default("Europe/Paris"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)]);

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: membershipRoleEnum("role").notNull().default("manager"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("memberships_org_user_idx").on(table.organizationId, table.userId),
  index("memberships_user_idx").on(table.userId),
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [index("categories_org_idx").on(table.organizationId)]);

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  assetCode: text("asset_code").notNull(),
  qrToken: text("qr_token").notNull(),
  serialNumber: text("serial_number"),
  photoUrl: text("photo_url"),
  condition: assetConditionEnum("condition").notNull().default("good"),
  status: assetStatusEnum("status").notNull().default("available"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("assets_org_code_idx").on(table.organizationId, table.assetCode),
  uniqueIndex("assets_qr_token_idx").on(table.qrToken),
  index("assets_org_idx").on(table.organizationId),
  index("assets_status_idx").on(table.status),
  index("assets_category_idx").on(table.categoryId),
]);

export const borrowers = pgTable("borrowers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  email: text("email"),
  borrowerCode: text("borrower_code"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("borrowers_org_idx").on(table.organizationId),
  index("borrowers_active_idx").on(table.active),
]);

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "restrict" }),
  borrowerId: uuid("borrower_id")
    .notNull()
    .references(() => borrowers.id, { onDelete: "restrict" }),
  issuedBy: text("issued_by"),
  checkedInBy: text("checked_in_by"),
  loanedAt: timestamp("loaned_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  status: loanStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  // Un objet ne peut avoir qu'un seul prêt actif : contrainte posée au niveau base.
  uniqueIndex("loans_one_active_per_asset_idx")
    .on(table.assetId)
    .where(sql`${table.status} = 'active'`),
  index("loans_org_idx").on(table.organizationId),
  index("loans_borrower_idx").on(table.borrowerId),
  index("loans_status_idx").on(table.status),
  index("loans_due_at_idx").on(table.dueAt),
]);

export const loanRequests = pgTable("loan_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "restrict" }),
  borrowerId: uuid("borrower_id").references(() => borrowers.id, {
    onDelete: "set null",
  }),
  requesterName: text("requester_name").notNull(),
  requesterEmail: text("requester_email"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  requestedDueAt: timestamp("requested_due_at", {
    withTimezone: true,
  }).notNull(),
  status: loanRequestStatusEnum("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  // Jeton non devinable permettant au demandeur de suivre sa demande sans compte.
  trackingToken: text("tracking_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("loan_requests_tracking_token_idx").on(table.trackingToken),
  index("loan_requests_org_idx").on(table.organizationId),
  index("loan_requests_asset_idx").on(table.assetId),
  index("loan_requests_status_idx").on(table.status),
]);

export const loanEvents = pgTable("loan_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id"),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("loan_events_org_idx").on(table.organizationId),
  index("loan_events_loan_idx").on(table.loanId),
]);

export const assetEvents = pgTable("asset_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id"),
  eventType: text("event_type").notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("asset_events_org_idx").on(table.organizationId),
  index("asset_events_asset_idx").on(table.assetId),
]);
