import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  resolve: {
    alias: [
      // Correspondance exacte uniquement (pas "@/db/schema") : tout le code
      // applicatif qui importe "@/db" se retrouve câblé sur la branche Neon
      // de test, sans aucune modification de ce code.
      { find: /^@\/db$/, replacement: path.resolve(import.meta.dirname, "./src/db/test-db.ts") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "./src") },
      // "server-only" lève une erreur hors du compilateur RSC de Next.js ;
      // neutralisé ici comme Next le fait lui-même en contexte serveur.
      {
        find: "server-only",
        replacement: path.resolve(import.meta.dirname, "./src/test-support/server-only-stub.ts"),
      },
    ],
  },
});
