import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";
import { defaultOrganizationSettings } from "@/lib/organizations/settings";

config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

// Seed de DÉVELOPPEMENT UNIQUEMENT. Ne jamais exécuter sur une base de
// production : ce script insère une organisation et des données fictives.
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Le seed de développement ne doit pas être exécuté en production.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL n'est pas définie (voir .env.local).");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  const demoUserId = process.argv[2];
  if (!demoUserId) {
    console.error(
      "Usage : npm run db:seed -- <stack-user-id>\n" +
        "Récupérez votre identifiant utilisateur Neon Auth (Stack) depuis /handler/account-settings après connexion.",
    );
    process.exit(1);
  }

  console.log("Insertion de l'organisation de démonstration...");

  const [organization] = await db
    .insert(schema.organizations)
    .values({
      name: "Lycée Démo",
      slug: "lycee-demo",
      timezone: "Europe/Paris",
      settings: defaultOrganizationSettings,
    })
    .onConflictDoNothing({ target: schema.organizations.slug })
    .returning();

  if (!organization) {
    console.log("L'organisation de démonstration existe déjà, seed ignoré.");
    await pool.end();
    return;
  }

  await db.insert(schema.memberships).values({
    organizationId: organization.id,
    userId: demoUserId,
    role: "owner",
  });

  const [category] = await db
    .insert(schema.categories)
    .values({
      organizationId: organization.id,
      name: "Informatique",
      description: "Ordinateurs, tablettes et accessoires",
    })
    .returning();

  await db.insert(schema.assets).values([
    {
      organizationId: organization.id,
      categoryId: category.id,
      name: "Ordinateur portable Dell Latitude",
      assetCode: "INFO-001",
      qrToken: crypto.randomUUID(),
      condition: "good",
      status: "available",
      location: "Salle informatique",
    },
    {
      organizationId: organization.id,
      categoryId: category.id,
      name: "Vidéoprojecteur Epson",
      assetCode: "INFO-002",
      qrToken: crypto.randomUUID(),
      condition: "worn",
      status: "available",
      location: "Réserve matériel",
    },
  ]);

  console.log(`Organisation de démonstration créée : /org/${organization.slug}/dashboard`);
  await pool.end();
}

main().catch((error) => {
  console.error("Échec du seed :", error);
  process.exit(1);
});
