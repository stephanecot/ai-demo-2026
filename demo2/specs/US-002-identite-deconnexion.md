# US-002 — Voir qui je suis et me déconnecter

**Prérequis** : US-001 — un profil doit pouvoir être choisi.

## User Story

**En tant qu'** utilisateur connecté,
**je veux** voir en permanence sous quelle identité je navigue et pouvoir en changer,
**afin de** basculer entre consultant et manager pendant la démonstration.

## Critères d'acceptation

- [ ] L'en-tête affiche le nom et le rôle de l'utilisateur connecté, sur toutes les pages.
- [ ] Un bouton « Se déconnecter » est présent dans l'en-tête.
- [ ] La déconnexion ramène à l'écran de choix de profil et efface l'identité courante.
- [ ] Après déconnexion, plus aucune requête ne porte l'en-tête `X-Demo-User`.

## Règles métier

- Le rôle affiché est celui résolu par le backend, jamais une valeur conservée côté client.

## Notes techniques

- `GET /api/auth/moi` — retourne l'utilisateur courant à partir de l'en-tête `X-Demo-User` ; `401` si l'en-tête est absent ou inconnu.
- La déconnexion est purement côté client : elle efface l'identité et cesse d'envoyer l'en-tête.
