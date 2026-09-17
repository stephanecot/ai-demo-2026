# Graphiques

L'ordre compte : **la forme d'abord, la couleur en dernier**. Un graphique dont on choisit les
couleurs avant la forme est presque toujours raté.

## 1. Choisir la forme

| La question posée | La forme |
|---|---|
| « Combien ce mois-ci ? » | Un **chiffre** dans une tuile, pas un graphique. |
| « Comment ça évolue jour après jour ? » | **Barres empilées** par jour (une barre = un jour, les segments = les modèles). |
| « Comment ça monte au fil d'une session ? » | **Courbe** de coût cumulé, points marqués, point sélectionné plus gros. |
| « Où part l'argent ? » (projets, agents, outils) | **Barres horizontales triées**, la plus grosse en haut. Jamais un camembert. |
| « Ça monte ou ça descend, en gros ? » | **Micro-courbe** décorative dans la tuile, sans axe ni point ni infobulle — la valeur chiffrée est à côté et porte le sens. |
| « Où en est-on du plafond ? » | **Jauge** horizontale avec le libellé d'état à côté. |
| « Quel modèle coûte quoi à l'unité ? » | **Tableau** : les tarifs se lisent, ils ne se dessinent pas. |

Un camembert ou un anneau n'est acceptable que pour une répartition à **deux ou trois parts**,
et seulement si les pourcentages sont écrits dessus. Par défaut : barres.

## 2. Les couleurs de séries (figées)

```
Opus 5     #d95926
Sonnet 5   #3987e5
Haiku 4.5  #199e70
```

Ces trois-là ont été validées ensemble sur le fond sombre : bande de luminosité, plancher de
chroma, séparation sous simulation deutan/tritan, contraste contre la surface. **Elles restent
des littéraux dans le code du graphique** (pas `var(--modele-opus)`) pour pouvoir être
revalidées telles quelles par un outil.

Règles d'attribution :

- La couleur suit **l'entité**, jamais son rang. Filtrer ou trier ne repeint personne.
- Pas de quatrième couleur générée : un quatrième modèle devient « Autres » en `--texte-4`, ou
  bien on passe en petits multiples.
- Une couleur d'état (`--etat-*`) ne devient jamais une couleur de série, et réciproquement.
- Le texte (valeurs, libellés, légende) porte une couleur de texte ; la pastille colorée à côté
  porte l'identité.

Pour une intensité continue (une carte de chaleur de l'activité par jour et par heure) : **une
seule teinte**, du clair au foncé, jamais un arc-en-ciel. Pour un écart signé (au-dessus /
au-dessous du budget) : deux teintes opposées avec un gris neutre au milieu.

## 3. Marques et anatomie

- **Barres empilées** : écart de 2 px entre segments (la couleur de la surface passe au
  travers), extrémité haute du segment le plus haut arrondie à 2 px, pas d'arrondi en bas.
  Largeur de barre identique partout, `gap` régulier.
- **Courbes** : trait de 2 px, jointures arrondies. Points de 3,5 px, point sélectionné 5 px
  avec un anneau de 2 px de la couleur de la surface.
- **Micro-courbe** : trait de 2 px, `--texte-3` par défaut (ou une couleur de modèle si la tuile
  parle d'un modèle précis), pas d'axe, pas de point, pas de survol, pas de légende. Elle ne
  porte jamais une valeur qu'on ne peut pas lire ailleurs sur la tuile.
- **Grille** : trois lignes horizontales maximum, en `--ligne`. Pas de grille verticale. Axe des
  abscisses en micro-label, un jour sur un si ça tient, sinon un sur deux.
- **Un seul axe vertical.** Deux mesures d'échelles différentes = deux graphiques, ou une mesure
  indexée. Jamais un deuxième axe à droite.
- **Pas de valeur sur chaque point.** On étiquette le point sélectionné et les extrêmes, c'est
  tout.
- L'échelle part de **zéro** pour toute barre. Une courbe peut être tronquée si l'axe le dit.

## 4. Interaction

- Survol d'une barre ou d'un point : **infobulle** avec la date, le total, puis une ligne par
  série (pastille + libellé + valeur). Fond `--surface-3`, bordure `--ligne-forte`, ombre
  `--ombre`.
- Clic : sélectionne la journée ou le tour, et le reste de l'écran se met à jour. La sélection
  est visible sans l'infobulle (liseré, point grossi, ligne repère en pointillés).
- Zone de clic plus large que la marque dessinée : la colonne entière est cliquable, pas
  seulement les segments colorés.
- Les filtres (période, unité) vivent sur **une seule ligne au-dessus** des graphiques, jamais
  dispersés.

## 5. Accessibilité

- Dès deux séries : légende présente. Jusqu'à quatre séries, les valeurs clés sont aussi
  étiquetées en clair — l'identité ne repose jamais sur la couleur seule.
- Tout graphique a une **alternative lisible** : le tableau correspondant est accessible sur le
  même écran ou à un clic.
- Vérifier en niveaux de gris : si deux séries deviennent indistinguables, ajouter une
  étiquette directe ou une texture diagonale, pas une nouvelle couleur.

## 6. À ne jamais faire

Double axe vertical · camembert à plus de trois parts · barre tronquée ne partant pas de zéro ·
arc-en-ciel pour une grandeur continue · couleur d'état réutilisée en série · valeur écrite sur
chaque point · légende absente à deux séries · couleur qui change quand on trie · effet 3D,
ombre portée sur une barre, dégradé dans une série.
