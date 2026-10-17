import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prerendering sont expérimentaux dans Next 16
  // et exigeraient des limites <Suspense> explicites sur toutes les pages
  // dynamiques (cookies, searchParams, lectures base à chaque requête).
  // Désactivés volontairement pour un rendu dynamique classique, prévisible
  // sur une application métier.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
