# Locatrack

**Scannez. Empruntez. Retrouvez.**

SaaS multi-tenant de gestion du matériel, des prêts, des retours et des demandes autonomes par QR code, pour les établissements scolaires et centres de formation.

## Pile technique

- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- PostgreSQL via Neon, Drizzle ORM (migrations versionnées dans `drizzle/`)
- Authentification : Neon Auth (Stack Auth) — email/mot de passe
- QR codes : génération serveur (`qrcode`), lecture caméra (`html5-qrcode`)
- Photos de matériel : Vercel Blob (upload direct navigateur → stockage, jeton émis côté serveur)
- Zod pour toute validation d'entrée
- Vitest pour les tests unitaires et d'intégration

## Mise en route locale

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (voir ci-dessous)
npm run db:migrate            # applique les migrations sur votre base Neon
npm run dev
```

L'application démarre sur `http://localhost:3000`.

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion Postgres Neon (poolée, `sslmode=require`). |
| `TEST_DATABASE_URL` | *(optionnel)* Branche Neon dédiée aux tests d'intégration (`npm run test:integration`) — ne jamais réutiliser la base de développement/production. Créez-la par branchement depuis votre branche principale (console Neon, ou MCP `create_branch`). |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | Identifiant de projet Neon Auth / Stack Auth. |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Clé publique Stack Auth. |
| `STACK_SECRET_SERVER_KEY` | Clé secrète serveur Stack Auth — à récupérer dans la console Neon (onglet **Auth** du projet) ou sur app.stack-auth.com. **Sans cette clé, l'application ne démarre pas.** |
| `BLOB_READ_WRITE_TOKEN` | Jeton d'accès Vercel Blob, pour l'upload des photos de matériel. Généré automatiquement en liant un Blob store à votre projet Vercel (`vercel blob store create` ou dans le dashboard Vercel). |
| `APP_BASE_URL` | URL publique de base, utilisée pour construire les URL des QR codes (`http://localhost:3000` en local, `https://votre-domaine.vercel.app` en production). |

### Activer l'authentification par e-mail/mot de passe

Neon Auth désactive par défaut la connexion par mot de passe. Avant le premier essai de connexion :

1. Console Neon → votre projet → onglet **Auth** (ou app.stack-auth.com, projet correspondant à `NEXT_PUBLIC_STACK_PROJECT_ID`).
2. Activer la méthode **Email/Password**.
3. Copier la **clé secrète serveur** dans `STACK_SECRET_SERVER_KEY`.

## Créer le premier administrateur

1. Démarrer l'application, ouvrir `http://localhost:3000` → redirection automatique vers `/handler/sign-up`.
2. Créer un compte (e-mail/mot de passe).
3. Vous êtes redirigé vers `/onboarding` : renseignez le nom de votre établissement et son fuseau horaire.
4. La validation crée l'organisation et vous attribue automatiquement le rôle **owner** — vous êtes l'administrateur principal.

Il n'y a pas de procédure séparée : la création du premier compte **est** la création du premier administrateur.

### Jeu de données de démonstration (développement uniquement)

```bash
npm run db:seed -- <votre-identifiant-utilisateur-stack>
```

L'identifiant utilisateur est visible dans `/handler/account-settings` une fois connecté. Le script crée une organisation « Lycée Démo », une catégorie et deux objets, et refuse de s'exécuter si `NODE_ENV=production`.

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement. |
| `npm run build` / `npm run start` | Build et exécution en production. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Vérification TypeScript stricte, sans émission. |
| `npm run test` | Tests unitaires (logique pure, aucun accès réseau). |
| `npm run test:integration` | Tests d'intégration contre `TEST_DATABASE_URL` (concurrence, isolation entre organisations, accès publics, exports). |
| `npm run db:generate` | Génère une migration SQL à partir de `src/db/schema.ts`. |
| `npm run db:migrate` | Applique les migrations en attente sur `DATABASE_URL`. |
| `npm run db:seed` | Jeu de données de démonstration (développement uniquement). |

## Stratégie de migration Neon

- Le schéma est défini dans `src/db/schema.ts` ; toute évolution passe par `npm run db:generate`, qui produit un fichier SQL versionné dans `drizzle/`.
- **Relire systématiquement** le SQL généré avant de l'appliquer — en particulier toute instruction `DROP`.
- `npm run db:migrate` applique les migrations en attente ; aucune migration n'est exécutée automatiquement au démarrage de l'application ou au déploiement.
- Pour la production, appliquer les migrations manuellement (ou via une étape de déploiement explicite) **avant** de basculer le trafic sur la nouvelle version, jamais dans le même geste qu'un déploiement automatique.
- Utiliser une branche Neon (comme `TEST_DATABASE_URL` ci-dessus) pour valider une migration avant de la jouer sur la base de production.

## Déploiement sur Vercel

1. **Base de données** : créer un projet Neon (ou utiliser celui existant), puis provisionner Neon Auth sur sa branche par défaut (console Neon → Auth → Enable).
2. **Variables d'environnement** : dans Vercel → Project Settings → Environment Variables, renseigner toutes les variables du tableau ci-dessus. `APP_BASE_URL` doit pointer vers le domaine Vercel final.
3. **Stockage photos** : lier un Vercel Blob store au projet (Vercel → Storage → Create Database → Blob) ; la variable `BLOB_READ_WRITE_TOKEN` est alors injectée automatiquement.
4. **Migrations** : exécuter `npm run db:migrate` (localement ou via une étape CI dédiée) contre la base de production **avant** le premier déploiement, puis après chaque changement de schéma.
5. **Déployer** : `vercel --prod`, ou connecter le dépôt Git au projet Vercel pour un déploiement continu.
6. Aucun fichier n'est jamais écrit sur le système de fichiers local du serveur (photos → Vercel Blob, aucune autre persistance locale).

### Tester le scanner QR en HTTPS

L'accès à la caméra (`getUserMedia`) exige HTTPS, sauf sur `localhost` où les navigateurs l'autorisent en clair :

- **Sur l'ordinateur de développement** : `http://localhost:3000` suffit pour tester le scan à la caméra.
- **Sur un téléphone, en local** : la caméra refusera `http://<ip-locale>:3000` (origine non sécurisée). Utiliser soit :
  - `npx next dev --experimental-https` (certificat auto-signé, à accepter manuellement sur le téléphone) ;
  - un tunnel HTTPS (`npx ngrok http 3000` ou équivalent) ;
  - un déploiement de prévisualisation Vercel (`vercel`), qui est HTTPS par défaut.
- **En production**, Vercel fournit HTTPS automatiquement : aucune configuration supplémentaire.

## Tests

- `npm run test` couvre la logique pure sans dépendance réseau : permissions/rôles, validation des schémas, génération de jetons, calcul de date de retour par fuseau horaire, échappement CSV.
- `npm run test:integration` couvre, contre une vraie base Postgres (branche Neon dédiée) :
  - l'isolation stricte entre organisations ;
  - la création d'un prêt et la mise à jour immédiate de la disponibilité ;
  - le double emprunt concurrent (une seule tentative réussit) ;
  - l'approbation d'une demande (revérification de disponibilité, aucun prêt invalide créé) ;
  - le retour d'un matériel endommagé (pas de retour automatique à disponible) ;
  - le calcul des retards ;
  - l'archivage d'un objet (bloqué si prêt actif) ;
  - l'accès public via QR code (aucune donnée privée exposée) ;
  - l'export CSV (périmètre strict de l'organisation, filtres respectés).

## Limites connues du MVP

- Le limiteur de débit des points d'accès publics (`src/lib/rate-limit.ts`) est en mémoire de processus : il ne protège pas contre un abus distribué sur plusieurs instances serverless. Pour une production à fort trafic, le remplacer par un store partagé (ex. Upstash Redis).
- Aucune suppression automatique des données personnelles anciennes n'est implémentée (politique de conservation à définir selon le contexte de l'établissement).
