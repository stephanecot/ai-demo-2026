# US-001 — Authentification (bouchonnée pour la démo)

## User Story

**En tant qu'** utilisateur de la démo,
**je veux** me connecter en choisissant simplement un profil prédéfini,
**afin de** montrer les parcours Consultant et Manager sans mettre en place une vraie gestion d'identité.

> ⚠️ **Authentification bouchonnée** : pas de mot de passe, pas de gestion de comptes. L'objectif est uniquement de porter les rôles et l'identité de l'utilisateur courant dans le reste de l'application.

## Critères d'acceptation

- [ ] L'écran de connexion affiche une liste de profils prédéfinis (ex. : *Jean Dupont — Consultant*, *Marie Martin — Consultante*, *Paul Durand — Manager*).
- [ ] Cliquer sur un profil connecte immédiatement l'utilisateur (aucun mot de passe demandé).
- [ ] Après connexion, l'utilisateur est redirigé vers son tableau de bord, adapté à son rôle.
- [ ] Le nom et le rôle de l'utilisateur connecté sont affichés dans l'en-tête de l'application.
- [ ] Un bouton « Se déconnecter » ramène à l'écran de choix de profil.
- [ ] Le backend expose les profils de démo et associe chaque requête à l'utilisateur courant (en-tête ou token simplifié).

## Règles métier

- Deux rôles existent : **Consultant** et **Manager**. Ils conditionnent les écrans et les droits dans toutes les autres user stories.
- Les profils de démo sont chargés au démarrage du backend (jeu de données seed) : au moins 2 consultants et 1 manager, le manager ayant les 2 consultants dans son équipe.
- Les contrôles d'autorisation par rôle (ex. : seul un manager valide un CRA) restent appliqués côté backend, même avec l'authentification bouchonnée.

## Notes techniques

- Endpoints backend : `GET /api/auth/profils` (liste des profils de démo), `POST /api/auth/login` (sélection d'un profil → retourne un token simplifié ou l'identifiant de session).
- Le frontend transmet l'identité courante sur chaque requête (ex. : en-tête `X-Demo-User: <id>` ou Bearer token non signé).
- Ce bouchon est isolé derrière une interface côté backend afin de pouvoir brancher plus tard une vraie authentification (OIDC/JWT) sans toucher au reste du code.
