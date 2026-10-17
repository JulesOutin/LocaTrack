import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";

config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL n'est pas définie (voir .env.local).");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("Application des migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations appliquées avec succès.");

  await pool.end();
}

main().catch((error) => {
  console.error("Échec des migrations :", error);
  process.exit(1);
});
