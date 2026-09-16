# Exemple 2 — résultat attendu

Exécution réelle du prompt `exemple2.MD` le 16/09/2026. Sortie : `index.html` +
`styles.css`, capture `rendu.png`, carte des écarts `diff.png`.

## Étape 1 — Inventaire de la maquette

Portail de widgets (Netvibes habillé aux couleurs de Sage), 1265 × 925, quatre étages :

- **barre système** (0 → 24 px) : fond dégradé `#3d3d3d → #313131`, bouton vert
  « Add content » (11 → 130 px), menus *Dashboards / widgets / reader*, à droite le
  compte *Sage*, les réglages et l'extinction ;
- **logo** centré vers y = 60, sérif italique vert `#008066` ;
- **onglets** (113 → 141 px) : « ERP X3 » gris inactif, « Sage & You » et « Finances »
  en vert actif, « New Tab » en gris ;
- **grille de widgets** sur trois colonnes : gauche `x 11 → 477`, milieu `x 495 → 918`,
  droite `x 930 → 1264`, le widget « Project AX 1.1 » occupant les deux colonnes de
  droite ;
- **pied** vers y = 900 : « Powered by netvibes » et six liens.

**Le motif qui se répète** : chaque widget est une boîte blanche avec un bandeau de 22 px
en dégradé vert `#1eb582 → #0e9f77`, une icône à gauche, le titre en gras blanc, trois
actions à droite (partager, réglages, fermer), et un trait `#dddddd` sous le bandeau.
Une seule exception, relevée au pipette : **le widget Webnote a un bandeau plus clair et
plus jaune** (`#89c280 → #69b363`) — un autre thème de widget.

Palette relevée : fond de page `#f3f3f3`, en-têtes du Gantt `#e43708`, bandeau Financial
Times `#fbd4b3`, corps du Webnote `#eeffe0`, lignes paires du tableau fournisseurs
`#eeeeee`, texte général `#333`, 11 px Arial.

Géométrie relevée automatiquement (détection des bandes vertes et des lignes du
tableau) : bandeaux de widgets à y = 161, 389, 464, 542, 596, 613 ; lignes du tableau
fournisseurs de 29 px à partir de y = 273 ; articles FT de 52 à 58 px à partir de
y = 690 ; touches de la calculatrice sur 5 colonnes de 51 px, `=` sur deux lignes.

## Étape 2 — Construction

`index.html` + `styles.css`, sans framework, sans ressource externe, sans image : les
icônes (soleil, nuage, pictogrammes de widget, barres du Gantt, billet, pavé numérique)
sont faites en CSS. Les widgets sont positionnés en absolu sur un `.ecran` de
1265 × 925 px, ce qui est le moyen le plus court d'atteindre les coordonnées relevées.
Textes et données recopiés à l'identique depuis la maquette.

## Étape 3 — Capture

**Le plugin Chrome refuse les URL `file://`** (« Can't interact with browser-internal or
unparseable URLs »). La capture a donc été prise par Chrome en mode headless, ce qui a
l'avantage de donner exactement 1265 × 925 px, alors que la capture par l'extension est
remise à l'échelle de la fenêtre :

```bash
chrome --headless --window-size=1265,925 --force-device-scale-factor=1 \
  --screenshot=rendu.png file:///…/result/exemple2/index.html
```

## Étapes 4 et 5 — Mesure et itérations

| Tour | Score | Écart moyen | Ce qui a été corrigé |
|-----:|------:|------------:|----------------------|
| 1 | **71,8 %** | 31,8 / 255 | premier jet |
| 2 | 72,4 % | 30,4 | pavé de la calculatrice remis en grille 5 colonnes avec `=` sur deux lignes ; lignes du tableau fournisseurs à 29 px ; fond du Webnote aplati en `#eeffe0` ; icônes météo réduites ; hauteurs d'articles FT |
| 3 | 74,8 % | 29,1 | **lignes paires du tableau fournisseurs en `#eeeeee`** — c'était le plus gros bloc rouge de la carte |
| 4 | 75,7 % | 28,0 | bandeau Webnote passé à son vert clair spécifique ; trait `#dddddd` sous les bandeaux ; en-tête du widget fournisseurs remonté de 5 px ; texte du Webnote descendu de 11 px |
| 5 | **76,1 %** | 26,0 | passe « bugs graphiques » (ci-dessous) |

### Tour 5 — les bugs graphiques de la reconstruction

Relecture écran par écran, maquette et rendu côte à côte, plutôt qu'au score :

| Bug | Symptôme | Correction |
|-----|----------|------------|
| Fond du haut de page | toute la page était grise ; la maquette a une **bande blanche de 119 px** derrière le logo et les onglets | `.ecran::before` blanc de y = 24 à y = 143 |
| Icônes météo des trois jours | le soleil et le nuage débordaient de leur case et **recouvraient « Wednesday » et « 12/24°C »** | icônes dimensionnées en dur dans une case de 60 × 30 px avec `overflow: hidden`, texte en dessous |
| Gros nuage météo | un simple rectangle blanc arrondi, détaché du soleil | nuage en trois formes (`::before` / `::after`) qui se chevauchent |
| Icônes d'action des widgets | les `clip-path` produisaient des taches illisibles | trois SVG en `data:` (partage, réglages, fermeture) |
| Lignes du Gantt | toutes blanches, alors que la maquette alterne blanc / `#f0f2f0` | `.g-ligne:nth-child(even)` |
| Barre « Project 2 » | un `skewY(-3deg)` censé faire un escalier, rendu comme un rectangle penché | barre hachurée normale, comme les deux autres |
| Billet de banque du KPI | un rectangle gris vide flottant en haut à droite de la tuile | billet incliné à deux cadres, replacé sous « Average payment » |
| Pastille promo Financial Times | verte, alors qu'elle est **bleue** dans la maquette | dégradé `#3e77a0 → #12537f` |
| Émojis dans la barre système et les onglets | 🌿, ⏻, ||| et 🌐 — contraires à la consigne « icônes en SVG ou en CSS » | quatre SVG en ligne |

Les bandes encore fautives (`230-276`, `184-230`) sont celles du tableau fournisseurs et
de sa barre de recherche : du texte, à un ou deux pixels près, avec une autre police que
celle du poste d'origine. La carte `diff.png` ne montre plus de grand aplat rouge, ce qui
était le critère d'arrêt annoncé.

## Étape 6 — Zone par zone

| Zone | État | Commentaire |
|------|------|-------------|
| Barre système | conforme | dégradé, bouton vert, menus, icônes de droite |
| Logo Sage | **écart assumé** | police d'origine inconnue, rendue en Georgia italique — la forme des lettres diffère |
| Onglets | conforme | largeurs à quelques pixels près |
| Widget Supplier | conforme | en-tête, onglets, tableau 6 colonnes, lignes alternées, « next » |
| Widget Project AX | conforme | double en-tête de mois, curseur, trois barres hachurées, jalon rouge, trois colonnes d'heures |
| Widget To Do | conforme | 3 tâches, case cochée + texte barré, « New To Do » |
| Widget météo | **écart assumé** | mise en page et températures exactes, dessins soleil/nuage approchés (CSS pur, pas de sprite) |
| Widget Webnote | conforme | thème vert clair spécifique, deux paragraphes |
| Widget KPI REPRE011 | conforme | six indicateurs, encadré « 15987 € » |
| Widget Financial Times | conforme | bandeau pêche, pastille promo, onglets, trois articles dont un sur fond gris, « older » |
| Calculatrice | conforme | écran, 5 colonnes, `=` sur deux lignes, touches opérateurs sombres |
| Pied de page | conforme | « Powered by netvibes » et les six liens |
| Bordures de widgets | **non reproduit** | la maquette a un liseré gris `#dcdfe2` **et** un trait vert intérieur ; un seul trait a été posé |
| Icônes d'action des widgets | **approché** | partage / réglages / fermeture en SVG, silhouettes proches mais pas identiques |

**Score final : 76,1 % de pixels conformes, écart moyen 26/255.** Le reste est
essentiellement du rendu de texte : même à géométrie parfaite, deux moteurs et deux
polices ne posent pas les mêmes pixels.
