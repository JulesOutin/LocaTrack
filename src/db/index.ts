import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Nécessaire en environnement Node (hors Edge) pour que le driver Neon
// serverless puisse ouvrir une connexion WebSocket et supporter de vraies
// transactions interactives (BEGIN/COMMIT avec logique applicative entre
// les requêtes) — requis pour la création atomique des prêts.
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL n'est pas définie.");
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
