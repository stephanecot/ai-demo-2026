# Tokens — rôle par rôle

Les valeurs ci-dessous sont celles de `frontend/src/styles/tokens.css`. Ce tableau explique
**quand** utiliser chacune ; le fichier CSS reste la source de vérité des valeurs.

## Encre et surfaces

| Token | Valeur | Quand |
|---|---|---|
| `--fond` | `#101113` | Fond de page. Porte la trame gravée (voir plus bas). |
| `--fond-nav` | `#0c0d0f` | Barre latérale uniquement — plus sombre que la page, c'est ce qui la détache. |
| `--surface` | `#17191c` | Panneau : tuile, tableau, carte de budget. Le conteneur par défaut. |
| `--surface-2` | `#1d2023` | Surface encastrée dans un panneau (mini-tuile, élément de nav actif). |
| `--surface-3` | `#24282d` | Infobulle, piste de jauge vide, survol appuyé. |
| `--ligne` | `#2a2e33` | Bordure de panneau, séparateur de ligne de tableau. |
| `--ligne-forte` | `#373c43` | Bordure d'un contrôle (bouton fantôme, champ, interrupteur). |

Trame gravée du fond : deux dégradés linéaires à `#ffffff07`, maille de 48 px. C'est la seule
texture du produit — on ne l'empile pas sur un panneau.

## Texte

| Token | Valeur | Quand |
|---|---|---|
| `--texte` | `#eceae6` | Titres, chiffres clés, valeur d'une ligne. Blanc légèrement chaud. |
| `--texte-2` | `#cfd3d8` | Texte courant dans un tableau, phrase de verdict. |
| `--texte-3` | `#9ba3ad` | Libellé secondaire, unité, élément de nav inactif. |
| `--texte-4` | `#6d757f` | Micro-label, en-tête de colonne, métadonnée. |
| `--texte-5` | `#4f565e` | Mention légale, note de bas d'écran. À ne pas utiliser pour une information utile. |

## Accent

| Token | Valeur | Quand |
|---|---|---|
| `--accent` | `#d95926` | Action principale, indicateur de nav actif, chiffre héros de l'écran, courbe principale. **Un seul accent visible par zone.** |
| `--accent-clair` | `#f3b396` | Texte ou icône sur fond d'accent sourd. |
| `--accent-sourd` | `#2b2015` | Fond d'un segment sélectionné, d'une puce active. |
| `--accent-bord` | `#6b4a2e` | Bordure d'un élément sélectionné. |

L'accent ne désigne jamais une donnée (un modèle, une série). Il désigne *l'endroit où l'on
agit* et *le chiffre qui compte sur cet écran*.

## Données — couleurs de modèle (figées)

| Token | Valeur | Modèle |
|---|---|---|
| `--modele-opus` | `#d95926` | Opus 5 |
| `--modele-sonnet` | `#3987e5` | Sonnet 5 |
| `--modele-haiku` | `#199e70` | Haiku 4.5 |

Ces trois couleurs ont été validées ensemble (écart perceptuel et simulation du daltonisme)
sur le fond sombre. **On ne les remplace pas, on ne les réordonne pas, on n'en ajoute pas une
quatrième** : un quatrième modèle rejoint « Autres » en gris `--texte-4`, ou bien on passe en
petits multiples. Voir `graphiques.md`.

## États de budget et sévérités

| Token | Valeur | Sens | Libellé à afficher |
|---|---|---|---|
| `--etat-ok` | `#0ca30c` | < 70 % du plafond | « dans le budget » |
| `--etat-vigilance` | `#fab219` | 70 – 95 % | « à surveiller » |
| `--etat-limite` | `#ec835a` | 95 – 110 % | « limite atteinte » |
| `--etat-depassement` | `#d03b3b` | > 110 % | « dépassement prévu » |

Chaque état a un fond et une bordure sourds associés (`--etat-*-fond`, `--etat-*-bord`) pour
les encarts. Une couleur d'état ne sert **jamais** à colorer une série de graphique.

## Typographie

| Token | Valeur |
|---|---|
| `--police-titre` | `Archivo, "Segoe UI", sans-serif` — 600/700, interlettrage serré sur les grands titres |
| `--police-texte` | `Archivo, "Segoe UI", sans-serif` — 400/500 |
| `--police-chiffre` | `"JetBrains Mono", ui-monospace, monospace` — tous les nombres, codes, identifiants |

Échelle : 10 / 11 / 12 / 13 / 14 / 15 / 19 / 25 / 30 / 34 px.
Texte courant 13 px · micro-label 10 px · chiffre de tuile 30 à 34 px · titre d'écran 25 px.

Tout nombre comparable porte `font-variant-numeric: tabular-nums`. Les polices se chargent
depuis Google Fonts avec la pile de repli ci-dessus — un export PNG/PDF affiche le repli, donc
on ne compte jamais sur une métrique exacte d'Archivo pour tenir une mise en page.

## Espacement, rayon, ombre

| Token | Valeur | Usage |
|---|---|---|
| `--e-1` … `--e-8` | 2 / 4 / 6 / 8 / 10 / 12 / 16 / 20 px | `gap` et `padding`. Au-delà : 22, 26 px pour les marges d'écran. |
| `--rayon` | `3px` | Panneaux, boutons, champs. L'angle presque vif est un choix — ne pas arrondir davantage. |
| `--rayon-2` | `2px` | Pastilles, segments de barre, puces. |
| `--rayon-rond` | `50%` | Points de courbe, molette d'interrupteur. |
| `--ombre` | `0 10px 24px -12px rgba(0,0,0,.8)` | Infobulles et sur-couches uniquement. Les panneaux n'ont pas d'ombre. |

## Ce qu'on n'ajoute pas

- Un dégradé de fond, une ombre colorée, un flou d'arrière-plan.
- Une deuxième famille de police « pour le fun ».
- Un rayon supérieur à 3 px.
- Un token nommé par sa couleur (`--bleu-clair`) plutôt que par son rôle.
