# Corrigé — les défauts plantés dans `site/`

**À ne pas ouvrir pendant la démo, et à ne pas donner à Claude.** Sert au présentateur
pour cocher ce qui a été trouvé, et pour animer la discussion sur ce qui a été manqué.

29 défauts : 8 flagrants, 13 d'accessibilité « classiques », 8 de rendu. Les numéros de
ligne sont ceux de la version cassée (`git restore demo5/site` pour y revenir).

## Flagrants — ceux que la salle voit sans être experte

| # | Défaut | Où | Correctif attendu |
|---|--------|----|-------------------|
| F1 | Badge « OFFRE FLASH » qui clignote 4 fois par seconde — risque pour les personnes photosensibles (WCAG 2.3.1) | `styles.css` `.flash` / `@keyframes clignote` | supprimer l'animation, ou la passer sous 3 flashs/s et la couper sous `prefers-reduced-motion` |
| F2 | Bandeau défilant en boucle, impossible à arrêter (WCAG 2.2.2) | `styles.css` `.defilant` / `@keyframes defile` | bouton pause, ou texte statique |
| F3 | Promo = **image de texte** sans `alt` : « -30 % avec le code PRINTEMPS30 » est invisible pour un lecteur d'écran et illisible au zoom | `index.html` `<img src="promo.svg" class="promo">` | texte HTML stylé, ou `alt` reprenant l'intégralité du message |
| F4 | Bandeau cookies : texte blanc sur jaune pâle (≈ 1,3:1), « Tout accepter » énorme et vert, « Refuser » en 10 px gris clair — contraste **et** design manipulateur | `index.html` `.cookies`, `styles.css` `.cookies-*` | même poids visuel pour les deux choix, texte contrasté, vrais `<button>` |
| F5 | Le bandeau cookies (`position: fixed`) masque le bas de page et ne peut se fermer qu'à la souris | `styles.css` `.cookies` | `<button>` de fermeture focusable, et laisser respirer le contenu |
| F6 | Champs obligatoires signalés par un **astérisque rouge seul** : ni `required`, ni `aria-required`, ni légende | `index.html` `.champ` / `.etoile` | `required` + libellé « (obligatoire) » + légende en début de formulaire |
| F7 | Mentions légales en 9 px, gris très clair, tout en majuscules | `styles.css` `.mentions` | 14 px minimum, casse normale, contraste AA |
| F8 | Coordonnées du pied de page en `aria-hidden="true"` : l'adresse et le téléphone n'existent pas pour un lecteur d'écran | `index.html` `.pied-texte` | retirer l'`aria-hidden` |

*Ces huit-là sont le point d'entrée du public non technique : ils se voient à l'œil nu,
sans connaître une seule règle WCAG.*

## Accessibilité

| # | Défaut | Où | Correctif attendu |
|---|--------|----|-------------------|
| A1 | `<html>` sans attribut `lang` | `index.html:2` | `<html lang="fr">` |
| A2 | Viewport figé (`width=1280`) : zoom impossible, pas de responsive | `index.html:5` | `width=device-width, initial-scale=1` |
| A3 | Images sans `alt` (logo et illustration) | `index.html:13`, `index.html:37` | `alt="Vélocité"` / `alt=""` si décorative |
| A4 | `tabindex` positifs : l'ordre de tabulation contredit l'ordre visuel | `index.html:17-19` | supprimer les `tabindex` |
| A5 | Menu burger = `<div>` cliquable, sans nom accessible, hors du clavier | `index.html:21` | `<button type="button" aria-label="Ouvrir le menu" aria-expanded="false">` |
| A6 | Hiérarchie des titres : `h1` puis `h4`, aucun `h2`/`h3` | `index.html:29,59,99,133` | passer les `h4` en `h2` (et le sous-titre du hero en `<p>`) |
| A7 | Boutons d'action en `<div onclick>` — non focusables, pas d'activation clavier | `index.html:34`, cartes « Choisir », `index.html:143` | vrais `<button type="button">` |
| A8 | Intitulé de lien non descriptif (« Cliquez ici ») | `index.html:35` | « Voir les formules » |
| A9 | Champs de formulaire sans `<label>` : le placeholder ne remplace pas un libellé | `index.html:135-142` | `<label for="…">` associés, placeholder en complément |
| A10 | Tableau sans en-têtes ni légende : `<td>` en guise de `<th>` | `index.html:101-105` | `<thead><tr><th scope="col">`, plus `<caption>` |
| A11 | État porté par la couleur seule (pastilles vertes / orange / rouges) | `index.html:111,117,123,129` | ajouter le texte (« disponible », « tendu », « saturé ») ou un `aria-label` + forme distincte |
| A12 | Focus clavier invisible (`*:focus { outline: none }`) | `styles.css:20-22` | supprimer la règle, ou `:focus-visible { outline: 2px solid …; outline-offset: 2px }` |
| A13 | Contraste insuffisant : texte `#b5b5b5` sur blanc (≈ 2,0:1) et blanc sur `#8fd0ff` (≈ 1,7:1) — minimum AA : 4,5:1 | `styles.css:5`, `styles.css:9` | assombrir `--gris-texte` (≈ `#5b6670`) et `--accent` (≈ `#0b6fa8`) |

*(A12 et A13 sont dans le CSS mais restent des défauts d'accessibilité — c'est la
remarque à faire si quelqu'un s'étonne du décompte « 11 + 6 ».)*

## Rendu graphique

| # | Défaut | Où | Correctif attendu |
|---|--------|----|-------------------|
| G1 | Accents du `h1` rognés (`line-height: 0.8` + `overflow: hidden`) | `styles.css:88-89` | `line-height: 1.05`, retirer l'`overflow` |
| G2 | Grille des offres plus large que le conteneur (3 × 380 + 64 > 1040) → débordement horizontal | `styles.css:81`, `styles.css:172` | `repeat(auto-fit, minmax(280px, 1fr))` |
| G3 | Badge « Populaire » coupé par l'`overflow: hidden` de la carte | `styles.css:178`, `styles.css:189-190` | retirer l'`overflow: hidden` ou repositionner le badge à l'intérieur |
| G4 | Carte « Confort » avec un padding différent → alignement cassé dans la rangée | `styles.css:184-186` | même padding que les autres |
| G5 | Étiquette « kilomètres parcourus ce mois-ci » tronquée sans ellipse | `styles.css:164-165` | retirer `white-space: nowrap` (ou ajouter `text-overflow: ellipsis` + `title`) |
| G6 | Barre d'occupation à 138 % : déborde de sa piste | `index.html:116` | plafonner à 100 % (et `overflow: hidden` sur `.piste`) |
| G7 | Lien « Mentions légales » en `position: absolute` sans parent positionné : il se superpose au contenu | `styles.css:356-358` | mise en page en flex dans le pied de page |
| G8 | En-tête `sticky` sans fond ni `z-index` : le contenu défile par-dessus | `styles.css:35-36` | `background: var(--fond); z-index: 10` |

## Ce que Claude rate souvent

Les candidats les plus fréquents à l'oubli, utiles pour la discussion finale :

- **A4** (tabindex positifs) — invisible sur une capture, il faut vraiment tabuler.
- **A11** (couleur seule) — beaucoup d'outils automatiques passent à côté.
- **G8** (sticky transparent) — ne se voit qu'après avoir fait défiler la page.
- **A2** (viewport figé) — souvent confondu avec un simple problème de responsive.

Si ces quatre-là sont trouvés, l'audit est bon. S'ils ne le sont pas : c'est l'exemple
parfait pour dire que l'outil accélère la revue, il ne la remplace pas.
