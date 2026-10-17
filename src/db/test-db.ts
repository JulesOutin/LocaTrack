import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Utilisé uniquement par la configuration vitest d'intégration, qui aliase
// "@/db" vers ce fichier pour que le code applicatif (inchangé) s'exécute
// contre une branche Neon dédiée aux tests plutôt que contre la base de
// développement. Ne jamais importer ce fichier directement depuis le code
// applicatif.
config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL n'est pas définie. Créez une branche Neon de test (voir .env.example) avant d'exécuter les tests d'intégration.",
  );
}

const pool = new Pool({ connectionString: testDatabaseUrl });

export const db = drizzle(pool, { schema });
