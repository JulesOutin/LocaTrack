/**
 * Limiteur de débit minimal, en mémoire de processus, pour les endpoints
 * publics (soumission et annulation de demandes de prêt sans compte).
 *
 * Limite connue : la mémoire n'est pas partagée entre instances serverless
 * ni survit à un redémarrage à froid. Pour une production à fort trafic,
 * remplacer par un store partagé (ex. Upstash Redis via
 * `@upstash/ratelimit`) en conservant la même signature `checkRateLimit`.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
