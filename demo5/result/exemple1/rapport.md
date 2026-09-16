# Exemple 1 — résultat attendu

Exécution réelle du prompt `exemple1.MD` sur `http://localhost:4173`, le 16/09/2026,
via le plugin Claude in Chrome. La page corrigée est dans `site/` (copie de `demo5/site`
laissée intacte pour rejouer la démo).

## Étape 1 — Ce que fait la page

Page vitrine de « Vélocité », un abonnement de vélo électrique : une promesse et deux
appels à l'action, quatre chiffres clés, trois formules d'abonnement (39 € / 59 € / sur
devis), un tableau de disponibilité par agence, et un formulaire de contact. Tout est
statique, servi depuis `demo5/site/`, sans appel réseau.

## Étape 2 — Audit

29 défauts. Preuves relevées dans le DOM et sur les captures, pas dans le code source.

### Bloquants

| # | Défaut | Où | Preuve relevée | Pourquoi c'est bloquant |
|---|--------|----|----------------|-------------------------|
| 1 | Badge « OFFRE FLASH » clignotant | `.flash` | `animation: clignote 0.25s × infinite` → **4 flashs/s** | WCAG 2.3.1 : au-delà de 3 flashs/s, risque de crise pour les personnes photosensibles |
| 2 | 9 contrôles cliquables non focusables | `.burger`, `.cta`, 3 × `.bouton-carte`, `.bouton-envoyer`, 3 boutons cookies | tous `DIV`/`SPAN`, `tabIndex = -1` | au clavier, on ne peut ni s'abonner, ni choisir une formule, ni envoyer le formulaire, ni refuser les cookies |
| 3 | Focus clavier invisible | `*:focus { outline: none }` | `outline-style: none` sur les 4 premiers éléments focusables | un utilisateur au clavier ne sait jamais où il est |
| 4 | Contraste du bandeau cookies | `.cookies-texte` | blanc sur `#fdf3c9` = **1,11:1** (minimum AA : 4,5:1) | le texte est illisible pour tout le monde |
| 5 | « Refuser » quasi invisible | `.cookies-refuser` | 10 px, `#e4d9a6` sur `#fdf3c9` = **1,28:1**, face à un « Tout accepter » vert de 16 px | consentement non libre : choix déséquilibré et illisible |
| 6 | Champs de formulaire sans `<label>` | 4 champs | `labels.length = 0`, `aria-label` absent, `required` absent | un lecteur d'écran annonce « zone de texte » sans dire laquelle |
| 7 | Promo en image de texte, sans `alt` | `promo.svg` (980 × 64) | `-30 % … code PRINTEMPS30` n'existe que dans l'image | l'offre et le code promo sont invisibles pour un lecteur d'écran, et pixellisés au zoom |
| 8 | Viewport figé | `<meta name="viewport" content="width=1280">` | — | zoom bloqué et mise en page de 1280 px imposée sur un écran de 390 px |

### Majeurs

| # | Défaut | Où | Preuve relevée |
|---|--------|----|----------------|
| 9 | Ordre de tabulation inversé | `tabindex` 3/2/1 sur la navigation | ordre réel : Contact → Agences → Offres, alors que l'ordre visuel est Offres → Agences → Contact |
| 10 | État des agences porté par la couleur seule | `.pastille` | `textContent = ""`, `aria-label` absent, 4 pastilles vert/orange/rouge |
| 11 | Tableau sans en-têtes | `.tableau` | **0 `<th>`**, 20 `<td>`, pas de `<caption>` |
| 12 | Contrastes de texte insuffisants | `.accroche`, `.lien-secondaire` | `#b5b5b5` sur blanc = **2,05:1** |
| 13 | Contraste du bouton principal | `.cta` | blanc sur `#8fd0ff` = **1,66:1** |
| 14 | Étiquettes de tuiles | `.tuile .etiquette` | **1,93:1** en 14 px |
| 15 | Mentions légales illisibles | `.mentions` | 9 px, **1,60:1**, tout en majuscules |
| 16 | Coordonnées masquées aux lecteurs d'écran | `.pied-texte` | `aria-hidden="true"` sur l'adresse et le téléphone |
| 17 | Bandeau défilant sans pause | `.defilant span` | `animation: defile 14s × infinite`, aucun contrôle |
| 18 | Hiérarchie des titres | 1 × `h1` puis 4 × `h4` | aucun `h2`, aucun `h3` |
| 19 | Images sans `alt` | `logo.svg`, `illustration.svg` | 3 images au total sans attribut `alt` |
| 20 | Langue du document absente | `<html>` | `lang = (absent)` |
| 21 | Intitulé de lien non descriptif | « Cliquez ici » | — |
| 22 | Champs obligatoires signalés par un astérisque rouge seul | `.etoile` | `required = false` sur les 4 champs |
| 23 | Menu burger sans nom accessible | `.burger` | `<div>` contenant « ☰ », ni `aria-label`, ni `aria-expanded` |
| 24 | Aucun repère de page | — | ni `<header>`, ni `<nav>`, ni `<main>`, ni `<footer>` |

### Mineurs (rendu graphique)

| # | Défaut | Preuve relevée |
|---|--------|----------------|
| 25 | Accents et jambages du `h1` rognés | `line-height: 43,2px` + `overflow: hidden`, `scrollHeight 57` vs `clientHeight 43` → **14 px coupés** |
| 26 | Grille des offres hors du conteneur | conteneur `433 → 1473`, dernière carte `1257 → 1637` → **164 px de débordement**, et barre de défilement horizontale sous 1268 px |
| 27 | Badges « Populaire » / « Nouveau » coupés | badge à `top = 794`, carte à `top = 807`, `overflow: hidden` sur la carte |
| 28 | Carte « Confort » désalignée | `padding: 12px 18px` contre `28px` pour les deux autres |
| 29 | Barre d'occupation débordante et lien flottant | Lyon : `138%` → **304 px dans une piste de 220 px** ; `.lien-legal` en `position: absolute` ancré à `y = 894` alors que le pied de page commence à `y = 1960` |

### Deux remarques d'exécution

- **Le test au clavier n'a pas pu être fait avec la touche `Tab`** : les frappes envoyées
  par l'extension ne déclenchent pas la navigation par défaut du navigateur
  (`document.activeElement` reste `BODY`). L'ordre de tabulation a donc été reconstruit
  dans la page (liste des éléments focusables triée par `tabindex`) et la visibilité du
  focus mesurée en appelant `.focus()` puis en lisant `outline-style`. Même conclusion,
  autre méthode — à dire à voix haute plutôt qu'à cacher.
- **Le redimensionnement de fenêtre n'a pas pris effet** dans cet environnement
  (`innerWidth` reste à 1920). L'impact mobile est donc démontré par le `<meta viewport>`
  figé à 1280 px et par la largeur fixe du conteneur, pas par une capture en 390 px.

## Étape 3 — Corrections appliquées

Dans `site/index.html` et `site/styles.css`, sans redessiner la page.

**Structure et sémantique** — `lang="fr"` ; viewport `width=device-width, initial-scale=1` ;
`<header>`, `<nav aria-label>`, `<main id="contenu">`, `<footer>` ; `h4` → `h2`, titres de
cartes en `h3`, sous-titre du hero en paragraphe ; lien d'évitement « Aller au contenu ».

**Contrôles** — les 9 faux boutons deviennent de vrais `<a>` ou `<button>` ; le burger est
un `<button aria-label aria-expanded aria-controls>` avec une icône SVG `aria-hidden` ;
« Cliquez ici » devient « Voir les formules » ; les boutons de cartes portent leur cible
(« Choisir la formule Essentiel »).

**Formulaire** — quatre `<label for>` associés, `required` + mention « (obligatoire) » en
toutes lettres, `autocomplete`, consigne en tête de formulaire, `<button type="submit">`,
accusé de réception en `role="status"`.

**Tableau** — `<caption>`, `<thead>` avec `<th scope="col">`, nom d'agence en
`<th scope="row">`, état écrit en toutes lettres (« disponible », « tendue », « saturée »)
avec la pastille passée en `aria-hidden`, taux affiché en chiffres à côté de la barre.

**Couleurs et focus** — `--gris-texte` `#b5b5b5` → `#5b6670`, `--accent` `#8fd0ff` →
`#0b6fa8`, pastilles assombries ; `*:focus { outline: none }` remplacé par
`:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px }`.

**Animations** — clignotement supprimé (le badge reste, statique) ; bandeau défilant
remplacé par une liste statique.

**Cookies** — deux vrais `<button>` de même poids visuel, texte encre sur fond jaune,
bannière refermable au clavier.

**Rendu** — `line-height` du `h1` à 1,08 sans `overflow` ; grille en
`repeat(auto-fit, minmax(280px, 1fr))` ; `overflow: hidden` retiré des cartes ; padding
uniforme à 28 px ; barre de Lyon ramenée à 96 % dans une piste qui coupe le dépassement ;
pied de page en flex, plus de `position: absolute` ; en-tête sticky avec fond opaque et
`z-index: 20` ; media query à 720 px avec menu déroulant.

## Étape 4 — Vérification dans le navigateur

Page corrigée servie sur `http://localhost:4175`, mêmes mesures rejouées :

| Contrôle | Avant | Après |
|----------|-------|-------|
| `lang` | absent | `fr` |
| viewport | `width=1280` | `width=device-width, initial-scale=1` |
| Images sans `alt` | 3 | **0** |
| Champs sans `<label>` | 4 | **0** (et 2 `required`) |
| Faux boutons non focusables | 9 | **0** |
| Animations infinies | 2 | **0** |
| `<th>` dans le tableau | 0 | **8** + `<caption>` |
| État des agences | couleur seule | « disponible » / « tendue » / « saturée » |
| `aria-hidden` sur les coordonnées | oui | non (ne reste que sur les pastilles décoratives) |
| Contraste `.accroche` | 2,05:1 | **5,87:1** |
| Contraste `.cta` | 1,66:1 | **5,45:1** |
| Contraste `.tuile .etiquette` | 1,93:1 | **5,51:1** |
| Contraste `.cookies-texte` | 1,11:1 | **14,77:1** |
| Contraste `.mentions` | 1,60:1 (9 px) | **5,87:1** (14 px) |
| `h1` | `scrollH 57` / `clientH 43` — rogné | `scrollH 65` / `clientH 58`, `overflow: visible` |
| Cartes | paddings 28 / 12-18 / 28 | **28 px partout**, badges `overflow: visible` |
| Barre de Lyon | 304 px dans 220 px | **173 px dans 180 px** |
| En-tête sticky | fond transparent, `z-index: auto` | fond blanc, `z-index: 20` |
| Ordre de tabulation | Contact → Agences → Offres | évitement → Offres → Agences → Contact → burger → … → cookies (18 arrêts, ordre visuel) |
| Focus | `outline: none` | `:focus-visible { outline: 3px solid #0b6fa8 }` |

**Reste à faire, honnêtement** : la règle `:focus-visible` est bien déclarée et lue dans
la feuille de style, mais elle n'a pas pu être constatée à l'écran — `.focus()` en
JavaScript ne déclenche pas `:focus-visible` sur un lien, et la touche `Tab` de
l'extension ne navigue pas. À vérifier à la main dans le navigateur avant de conclure.
Le comportement en 390 px de large repose lui aussi sur la media query et le viewport
corrigé, pas sur une capture.
