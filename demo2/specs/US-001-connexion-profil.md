# US-001 — Se connecter en choisissant un profil de démo

## User Story

**En tant qu'** utilisateur de la démo,
**je veux** choisir un profil dans une liste pour me connecter,
**afin de** parcourir l'application sous une identité donnée sans gérer de comptes.

> Authentification **bouchonnée** : pas de mot de passe, pas d'inscription. Le but est
> uniquement de porter une identité et un rôle dans le reste de l'application.

## Critères d'acceptation

- [ ] L'écran de connexion affiche les profils de démo, avec pour chacun le nom et le rôle.
- [ ] Cliquer sur un profil connecte immédiatement, sans mot de passe.
- [ ] Après connexion, l'utilisateur arrive sur la page d'accueil de l'application.
- [ ] Tant qu'aucun profil n'est choisi, toute autre page redirige vers l'écran de connexion.
- [ ] Si la liste des profils ne peut pas être chargée, un message d'erreur en français s'affiche avec un bouton « Réessayer ».

## Règles métier

- Deux rôles : **Consultant** et **Manager**. Le rôle est porté par le profil, jamais choisi par l'utilisateur.
- Les profils de démo viennent du jeu de données seed : au moins 2 consultants et 1 manager.

## Notes techniques

- `GET /api/auth/profils` — liste des profils de démo (id, nom, rôle), accessible sans identité.
- L'identité retenue est envoyée sur chaque requête suivante via l'en-tête `X-Demo-User`.
- Le bouchon est isolé derrière une interface côté backend, pour pouvoir brancher une vraie authentification plus tard.
