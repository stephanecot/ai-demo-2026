## ADDED Requirements

### Requirement: Design tokens leboncoin
Le frontend SHALL définir ses couleurs, typographies, rayons et espacements comme variables CSS
dans `src/styles/tokens.css`, et les composants SHALL n'utiliser que ces tokens.

#### Scenario: Palette
- **WHEN** un composant a besoin d'une couleur
- **THEN** il utilise un token parmi : `--color-primary: #FF6E14` (orange leboncoin),
  `--color-primary-hover: #E8630F`, `--color-bg: #F5F5F5`, `--color-surface: #FFFFFF`,
  `--color-text: #1A1A1A`, `--color-text-muted: #5A5A5A`, `--color-border: #E0E0E0`,
  `--color-error: #D32F2F`, `--color-success: #2E7D32`

#### Scenario: Typographie et formes
- **WHEN** un composant affiche du texte ou une surface
- **THEN** il utilise `--font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  `--radius-md: 8px`, `--radius-pill: 999px` et l'échelle d'espacement `--space-1..8` (4px de base)

### Requirement: En-tête de site
Le frontend SHALL afficher sur toutes les pages un en-tête blanc avec le logo textuel
« leboncoin » (orange, gras), un bouton orange pill « Déposer une annonce » (vers `/deposer`)
et un champ de recherche non fonctionnel (placeholder « Rechercher sur leboncoin »).

#### Scenario: Navigation vers le dépôt
- **WHEN** l'utilisateur clique sur « Déposer une annonce »
- **THEN** la route `/deposer` s'affiche sans rechargement de page

### Requirement: Composants de formulaire partagés
Le frontend SHALL fournir dans `src/shared/ui/` les composants `Button`, `TextField`, `TextArea`,
`Select` et `Card`, chacun stylé avec les tokens et testé.

#### Scenario: Bouton principal
- **WHEN** un `Button` de variante `primary` est rendu
- **THEN** il est orange (`--color-primary`), texte blanc, forme pill, et passe à
  `--color-primary-hover` au survol ; en état `disabled` il est à 50 % d'opacité et non cliquable

#### Scenario: Champ en erreur
- **WHEN** un `TextField`/`TextArea`/`Select` reçoit une prop `error`
- **THEN** sa bordure passe en `--color-error` et le message s'affiche en dessous en rouge

### Requirement: Mise en page responsive
Les pages SHALL être lisibles de 375px à 1440px de large.

#### Scenario: Mobile
- **WHEN** la fenêtre fait moins de 768px
- **THEN** le formulaire occupe toute la largeur avec 16px de marge latérale et l'en-tête masque
  le champ de recherche
