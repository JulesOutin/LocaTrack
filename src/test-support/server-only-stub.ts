// Remplace le module "server-only" pendant les tests d'intégration (qui ne
// s'exécutent pas sous le compilateur RSC de Next.js, lequel neutralise
// normalement cet import). Ne jamais importer depuis le code applicatif.
export {};
