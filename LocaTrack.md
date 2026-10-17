# Projet Locatrack — MVP SaaS de gestion des prêts de matériel

## 1. Ton rôle

Tu es un développeur full-stack senior, architecte logiciel et designer UX/UI spécialisé dans les applications SaaS B2B.

Tu dois concevoir et développer **Locatrack**, une application web SaaS permettant aux établissements scolaires et centres de formation de gérer leur inventaire de matériel, les prêts, les retours et les demandes autonomes à l'aide de QR codes.

Tu dois produire une application réellement fonctionnelle, sécurisée, testable et déployable sur Vercel.

Ne te limite pas à une maquette visuelle. Les formulaires, les actions, les filtres, la base de données et les règles métier doivent fonctionner réellement.

## 2. Vision produit

Nom : Locatrack.

Signature : « Scannez. Empruntez. Retrouvez. »

Proposition de valeur :

Permettre à un établissement scolaire de savoir rapidement quel matériel est disponible, qui l'a emprunté et quand il doit être rendu, sans tableur complexe ni logiciel de gestion de parc lourd.

Public cible initial :
- Écoles.
- Lycées.
- Centres de formation.
- Organismes de formation.
- Établissements disposant de matériel partagé.

Exemples de matériel :
- Ordinateurs portables.
- Tablettes.
- Vidéoprojecteurs.
- Caméras et appareils photo.
- Matériel pédagogique.
- Équipements sportifs.
- Outils d'atelier.

## 3. Contraintes de développement

Utiliser :
- Next.js avec App Router.
- TypeScript en mode strict.
- Tailwind CSS.
- shadcn/ui pour les composants d'interface.
- PostgreSQL via Neon.
- Drizzle ORM et ses migrations.
- Une solution d'authentification maintenue et adaptée à Next.js.
- Zod pour valider les données.
- Une bibliothèque de génération et de lecture de QR codes compatible navigateur.
- Un stockage objet compatible avec le déploiement Vercel pour les images, si nécessaire.

Le projet doit être déployable sur Vercel.

Ne pas utiliser SQLite en production.

Ne pas stocker de fichiers persistants dans le système de fichiers local de Vercel.

Ne pas mettre de secrets dans le code source ou dans les variables exposées au navigateur.

Ne pas ajouter de dépendances sans nécessité.

Avant de choisir une version ou une API de bibliothèque, vérifier sa compatibilité avec les dépendances réellement installées.

## 4. Architecture

Construire une architecture multi-tenant.

Un utilisateur peut appartenir à une ou plusieurs organisations.

Chaque organisation dispose de ses propres :
- Membres et rôles.
- Catégories.
- Objets.
- Emprunteurs.
- Prêts.
- Demandes de prêt.
- Historiques et événements.

Toutes les opérations métier doivent vérifier côté serveur l'appartenance de l'utilisateur à l'organisation concernée et ses permissions.

Ne jamais faire confiance à un organization_id transmis par le navigateur sans vérifier l'autorisation.

Utiliser des transactions SQL pour les opérations sensibles.

Prévoir des migrations versionnées et reproductibles.

## 5. Modèle de données

Créer les tables suivantes :

### organizations
- id : UUID.
- name.
- slug.
- timezone.
- settings : JSONB avec valeurs validées.
- created_at.
- updated_at.

### users
- id.
- name.
- email.
- created_at.
- updated_at.

La gestion des identifiants, mots de passe ou comptes OAuth doit respecter les conventions de la solution d'authentification retenue.

### memberships
- id.
- organization_id.
- user_id.
- role : owner, admin ou manager.
- created_at.

Contrainte unique sur organization_id et user_id.

### categories
- id.
- organization_id.
- name.
- description facultative.
- created_at.

### assets
- id.
- organization_id.
- category_id nullable.
- name.
- asset_code.
- qr_token unique et aléatoire.
- serial_number nullable.
- photo_url nullable.
- condition : good, worn, damaged.
- status : available, unavailable, maintenance, archived.
- location nullable.
- notes nullable.
- created_at.
- updated_at.
- archived_at nullable.

Contrainte d'unicité sur asset_code au sein d'une organisation.

Ne pas exposer directement un identifiant interne prévisible comme jeton d'accès public.

### borrowers
- id.
- organization_id.
- display_name.
- email nullable.
- borrower_code nullable.
- active.
- created_at.
- updated_at.

Les données collectées doivent rester minimales. Ne pas demander de date de naissance ni de données sensibles.

### loans
- id.
- organization_id.
- asset_id.
- borrower_id.
- issued_by nullable.
- checked_in_by nullable.
- loaned_at.
- due_at.
- returned_at nullable.
- status : active, returned, cancelled.
- notes nullable.
- created_at.
- updated_at.

Un prêt en retard est un prêt actif dont due_at est dépassé. Calculer ce statut à la lecture ou dans une couche métier commune.

Un objet ne peut pas avoir deux prêts actifs simultanément. Faire respecter cette règle au niveau de la base et dans les transactions applicatives.

### loan_requests
- id.
- organization_id.
- asset_id.
- borrower_id nullable.
- requester_name.
- requester_email nullable.
- requested_at.
- requested_due_at.
- status : pending, approved, rejected, cancelled.
- reviewed_by nullable.
- reviewed_at nullable.
- review_note nullable.
- created_at.
- updated_at.

Les demandes publiques doivent utiliser un mécanisme de jeton sécurisé lorsqu'un lien de consultation ou de confirmation est nécessaire.

### loan_events
- id.
- organization_id.
- loan_id.
- actor_user_id nullable.
- event_type.
- metadata JSONB.
- created_at.

### asset_events
- id.
- organization_id.
- asset_id.
- actor_user_id nullable.
- event_type.
- notes nullable.
- metadata JSONB.
- created_at.

Ajouter les index utiles, les clés étrangères, les contraintes de cohérence et les règles de suppression appropriées.

Les événements historiques ne doivent pas être modifiés ou supprimés par les opérations ordinaires de l'application.

## 6. Rôles et permissions

### Owner
- Gérer l'organisation.
- Inviter ou retirer des membres.
- Modifier les paramètres.
- Gérer l'ensemble des objets, emprunteurs, prêts et demandes.

### Admin
- Gérer le matériel et les emprunteurs.
- Gérer les prêts et les retours.
- Traiter les demandes.
- Consulter les historiques et exports.
- Gérer les membres si l'autorisation lui est explicitement accordée.

### Manager
- Consulter le matériel.
- Enregistrer les prêts et retours.
- Traiter les demandes selon les permissions attribuées.
- Consulter les historiques nécessaires à son activité.

Les permissions doivent être appliquées côté serveur à chaque opération, et non seulement par masquage de boutons dans l'interface.

## 7. Fonctionnalités du MVP

### Authentification et onboarding
- Inscription et connexion.
- Déconnexion.
- Récupération de compte selon la solution retenue.
- Création d'une organisation.
- Création du premier compte administrateur.
- Parcours de première utilisation avec étapes simples.

### Tableau de bord
Afficher :
- Nombre total d'objets.
- Nombre d'objets disponibles.
- Nombre d'objets empruntés.
- Nombre de prêts en retard.
- Demandes en attente.
- Prochains retours.
- Dernières opérations.

Les chiffres doivent provenir de la base de données réelle.

### Gestion du matériel
- Liste paginée.
- Recherche par nom, référence ou numéro de série.
- Filtres par catégorie, état, disponibilité et emplacement.
- Création et modification d'un objet.
- Archivage d'un objet.
- Consultation de la fiche détaillée.
- Historique des prêts.
- Historique des changements d'état.
- Génération d'un QR code unique.
- Impression d'étiquettes adaptées au format A4.

Un objet ayant un prêt actif ne peut pas être archivé avant la résolution du prêt.

### Scan QR
- Scanner avec la caméra d'un téléphone.
- Permettre aussi la saisie ou la recherche manuelle du code.
- Ouvrir la fiche du matériel correspondant.
- Afficher clairement la disponibilité et les actions autorisées.
- Gérer les refus d'accès à la caméra.
- Prévoir une saisie alternative accessible.

Le QR code contient une URL publique utilisant un jeton aléatoire non devinable. Il ne contient aucune donnée personnelle.

Le scan ne doit jamais autoriser directement une modification administrative.

### Gestion des emprunteurs
- Créer et modifier un emprunteur.
- Désactiver un emprunteur sans supprimer son historique.
- Rechercher un emprunteur.
- Afficher ses prêts actifs et son historique selon les permissions.

Prévoir une création rapide de l'emprunteur lors de l'enregistrement d'un prêt.

### Prêts enregistrés par un gestionnaire
- Sélection du matériel.
- Sélection ou création rapide de l'emprunteur.
- Date de retour prévue.
- Commentaire facultatif.
- Validation.
- Mise à jour immédiate de la disponibilité.
- Consultation du prêt.
- Prolongation de la date de retour.
- Retour du matériel.
- Annulation contrôlée selon l'état du prêt.

La création d'un prêt doit être atomique. En cas de conflit entre deux opérations concurrentes, une seule doit réussir.

### Demandes autonomes
Permettre à un emprunteur de demander du matériel depuis un téléphone sans créer obligatoirement un compte applicatif.

Parcours :
1. Scanner le QR code ou ouvrir une page publique de demande.
2. Consulter les informations publiques autorisées.
3. Renseigner les informations minimales nécessaires.
4. Choisir une date de retour prévue.
5. Soumettre la demande.
6. Obtenir une confirmation et un identifiant de suivi sécurisé si nécessaire.

Une demande en attente ne bloque pas définitivement le matériel.

Le gestionnaire peut approuver ou refuser une demande.

L'approbation doit revérifier la disponibilité du matériel dans une transaction. Si l'objet n'est plus disponible, la demande ne doit pas créer de prêt invalide.

Prévoir une option d'organisation permettant de désactiver les demandes autonomes ou de les soumettre obligatoirement à validation.

### Retours
- Accès au prêt actif.
- Enregistrement de la date et de l'acteur du retour.
- Choix de l'état constaté.
- Commentaire ou signalement d'un incident.
- Clôture du prêt.
- Retour automatique à disponible uniquement si les règles de disponibilité le permettent.

### Historique
Journaliser les opérations significatives :
- Création et modification d'un objet.
- Création, approbation et refus d'une demande.
- Début, prolongation, annulation et clôture d'un prêt.
- Changement d'état du matériel.

Ne pas enregistrer de mots de passe, jetons secrets ou données personnelles inutiles dans les métadonnées.

### Exports
- Export CSV de l'inventaire.
- Export CSV des prêts selon les filtres autorisés.
- Respect strict du périmètre de l'organisation.
- Protection contre l'injection de formules dans les cellules CSV.

## 8. Règles métier essentielles

- Un objet archivé ou en maintenance ne peut pas être emprunté.
- Un objet indisponible ne peut pas être prêté.
- Un objet ne peut avoir qu'un prêt actif.
- Un retour clôture le prêt et enregistre l'état observé.
- Un matériel endommagé peut passer en maintenance ou indisponible.
- Une demande approuvée n'est pas un prêt tant que le processus de remise du matériel n'a pas créé le prêt.
- Une demande publique ne peut pas consulter les informations privées d'un emprunteur.
- Toutes les dates et heures sont traitées avec le fuseau de l'organisation.
- Les transitions de statut doivent être validées dans une couche métier unique.
- Les actions doivent être idempotentes lorsqu'un double clic ou une répétition de requête pourrait créer un doublon.

## 9. Interface utilisateur

Créer une interface SaaS moderne, professionnelle et sobre.

Identité visuelle :
- Nom : Locatrack.
- Bleu nuit et indigo comme couleurs principales.
- Fond clair.
- Cartes simples.
- Bordures discrètes.
- Icônes cohérentes.
- Typographie lisible.
- Espacements généreux.
- Contraste accessible.

L'interface doit être entièrement en français.

Concevoir en priorité les écrans suivants :
1. Page de connexion.
2. Création d'organisation.
3. Tableau de bord.
4. Inventaire.
5. Création et édition de matériel.
6. Fiche matériel.
7. Scan QR.
8. Création d'un prêt.
9. Liste des prêts.
10. Détail d'un prêt.
11. Retours.
12. Demandes en attente.
13. Gestion des emprunteurs.
14. Historique.
15. Paramètres de l'organisation.

Navigation desktop :
- Barre latérale : Tableau de bord, Matériel, Prêts, Demandes, Emprunteurs, Historique, Paramètres.
- Action de scan facilement accessible.

Navigation mobile :
- Priorité au scan et à la recherche.
- Boutons tactiles suffisamment grands.
- Formulaires courts.
- Navigation adaptée aux petits écrans.
- Pas de tableaux nécessitant un défilement horizontal permanent.

Prévoir des états de chargement, des listes vides, des erreurs explicites et des confirmations pour les opérations sensibles.

Ne pas utiliser de fausses données dans les vues de production. Les données de démonstration doivent être isolées dans un seed de développement.

## 10. Sécurité

- Valider les entrées côté serveur avec Zod.
- Vérifier l'authentification et les permissions pour chaque action.
- Isoler les données de chaque organisation.
- Utiliser des requêtes paramétrées.
- Protéger les actions sensibles contre les requêtes CSRF selon l'architecture retenue.
- Limiter les tentatives sur les endpoints publics.
- Ne pas exposer les variables serveur au navigateur.
- Protéger les URL et jetons de suivi des demandes.
- Appliquer des politiques de conservation et de suppression des données.
- Limiter les données personnelles collectées.
- Vérifier les fichiers uploadés et leurs types.
- Utiliser des URL de stockage sécurisées si nécessaire.
- Prévoir des journaux d'erreurs sans informations sensibles.

Les opérations sensibles doivent être autorisées et validées côté serveur.

## 11. Tests

Mettre en place des tests unitaires et d'intégration pour :
- Les permissions et rôles.
- L'isolation entre organisations.
- La création d'un prêt.
- Le double emprunt concurrent.
- L'approbation d'une demande.
- Le retour d'un matériel endommagé.
- Le calcul des retards.
- L'archivage d'un objet.
- Les accès publics via QR code.
- L'export CSV.

Ajouter des tests de parcours pour les flux essentiels si le budget de développement le permet.

## 12. Déploiement

Préparer :
- Un fichier .env.example sans secrets.
- Les scripts de migration.
- Un seed de développement.
- Une documentation locale.
- Une documentation de déploiement Vercel.
- La configuration des variables d'environnement.
- Une stratégie de migration Neon.
- Une procédure de création du premier administrateur.
- Des instructions pour tester le scanner en HTTPS.

Ne jamais lancer de migration destructive automatiquement en production.

## 13. Ordre de réalisation

### Phase 1 — Fondation
- Initialiser Next.js et TypeScript.
- Configurer Tailwind et shadcn/ui.
- Configurer Neon et Drizzle.
- Définir les migrations.
- Mettre en place l'authentification.
- Créer l'isolation multi-tenant.
- Construire la structure de navigation.

### Phase 2 — Inventaire
- CRUD matériel.
- Catégories.
- Recherche et filtres.
- QR codes et impression.
- Fiche matériel.

### Phase 3 — Prêts et retours
- Gestion des emprunteurs.
- Prêts.
- Retours.
- Disponibilité.
- Historique.
- Transactions et règles de concurrence.

### Phase 4 — Demandes autonomes
- Pages publiques.
- Formulaire de demande.
- Protection des jetons.
- Approbation et refus.
- Création contrôlée des prêts.

### Phase 5 — Finalisation
- Tableau de bord réel.
- Exports CSV.
- Tests.
- Accessibilité.
- Responsive.
- Documentation.
- Déploiement Vercel.

## 14. Méthode de travail obligatoire

Avant de commencer :
1. Examiner le dépôt existant.
2. Identifier les fichiers, dépendances et conventions déjà présents.
3. Présenter un plan d'implémentation succinct.
4. Signaler les décisions techniques nécessitant une clarification.

Puis développer par phases cohérentes.

Après chaque phase :
- Vérifier les erreurs TypeScript.
- Exécuter le lint.
- Exécuter les tests disponibles.
- Corriger les erreurs.
- Documenter les variables d'environnement nécessaires.
- Résumer les fichiers créés et les prochaines étapes.

Ne pas prétendre qu'une fonctionnalité fonctionne si elle n'a pas été implémentée et vérifiée.

Ne pas coder toute l'application dans un seul composant.
Ne pas laisser de boutons factices.
Ne pas contourner la sécurité pour accélérer le développement.
Ne pas créer de migrations SQL destructives sans justification.

Si un service externe nécessite une clé ou un compte non disponible, construire une intégration propre avec une configuration explicite et documenter la procédure pour l'activer.

## 15. Critères de réussite

Le MVP sera considéré comme fonctionnel lorsqu'un administrateur pourra :

1. Créer son organisation et se connecter.
2. Ajouter un objet et générer son QR code.
3. Imprimer une étiquette.
4. Scanner le QR code depuis un téléphone.
5. Enregistrer un prêt à un emprunteur.
6. Enregistrer un retour et un état du matériel.
7. Recevoir et traiter une demande autonome.
8. Consulter les retards et l'historique.
9. Exporter son inventaire.
10. Vérifier qu'un autre établissement ne peut pas accéder à ses données.

Commence par la Phase 1. Inspecte le dépôt, établis le plan technique, puis implémente progressivement une fondation fonctionnelle et sécurisée avant de poursuivre les autres phases.