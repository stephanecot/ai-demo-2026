# Tokenomètre — direction design

*Le « pourquoi ». Les valeurs vivent dans `frontend/src/styles/tokens.css`, les règles d'usage
dans le skill `.claude/skills/design-system/`. Les maquettes de référence sont les artboards
`design/*.dc.html`. En cas de désaccord : **tokens > plan > maquette**.*

## Parti pris : la console d'instruments

Une application qui compte de l'argent au millième de dollar se lit comme un tableau de bord
d'atelier, pas comme un SaaS générique. Chaque décision découle de cette phrase.

| Décision | D'où elle vient |
|---|---|
| **Fond graphite gravé**, trame de 48 px à `#ffffff07` | Un instrument a un boîtier, pas une page blanche. La trame donne l'échelle et la profondeur sans dégradé ni flou. Elle reste sous le seuil de lecture : on la sent, on ne la regarde pas. C'est la **seule** texture du produit, et elle ne s'empile jamais sur un panneau. |
| **Angles à 3 px, aucune ombre sur les panneaux** | Un boîtier fraisé, pas une carte flottante. Le rayon presque vif dit « appareil de mesure ». L'ombre est réservée à ce qui flotte vraiment : infobulles et sur-couches (`--ombre`). |
| **Un seul accent terre cuite** (`--accent`) | Si tout est accentué, rien ne l'est. L'accent désigne deux choses et deux seulement : *l'endroit où l'on agit* et *le chiffre qui compte sur cet écran*. Un seul bouton principal par écran ; tout le reste en bouton fantôme. |
| **Chiffres en monospace tabulaire** | On compare des colonnes de dollars et de millions de tokens. Elles doivent tomber l'une sous l'autre au pixel près, quel que soit le chiffre. `font-variant-numeric: tabular-nums` n'est pas un détail typographique, c'est une condition de lecture. |
| **Couleurs de données réservées aux données** | Trois couleurs de modèle, figées et validées ensemble sur le fond sombre. Elles portent une information — jamais un décor, jamais un rang, jamais un état. Symétriquement, une couleur d'état ne devient jamais une série. |
| **Jamais la couleur seule** | Un état de budget, une sévérité, un modèle portent toujours un libellé ou une icône à côté de leur pastille. Pour les daltoniens, pour l'impression, et pour quiconque lit en diagonale. |

## Typographie

| Rôle | Police | Repli |
|---|---|---|
| Titres, chiffres de tuile | `Archivo` 600/700 | `"Segoe UI"`, sans-serif |
| Texte courant | `Archivo` 400/500 | `"Segoe UI"`, sans-serif |
| Nombres, codes, identifiants | `JetBrains Mono` 400/500/700 | `ui-monospace`, monospace |

Échelle : 10 / 11 / 12 / 13 / 14 / 15 / 19 / 25 / 30 / 34 px. Texte courant 13 px, micro-label
10 px en majuscules interlettrées (`.micro`), chiffre de tuile 30-34 px, titre d'écran 25 px
avec un interlettrage serré. Archivo — un grotesque un peu carré, industriel — évite
volontairement les familles vues partout ; JetBrains Mono assume le sujet : c'est un produit
d'outillage de développement.

Les deux polices viennent de Google Fonts avec une pile de repli. Un export PNG/PDF affiche le
repli : on ne fait jamais reposer une mise en page sur la métrique exacte d'Archivo.

## Couleur

**Les trois couleurs de modèle** (`#d95926` Opus 5, `#3987e5` Sonnet 5, `#199e70` Haiku 4.5)
ont été choisies puis validées ensemble sur le fond sombre : bande de luminosité, plancher de
chroma, séparation perceptuelle sous simulation deutan et tritan, contraste contre la surface.
Elles sont figées. Un quatrième modèle rejoint « Autres » en `--modele-autres`, ou bien le
graphique passe en petits multiples — on ne fabrique pas une quatrième teinte.

**Les quatre couleurs d'état** (dans le budget, à surveiller, limite atteinte, dépassement
prévu) sont distinctes des couleurs de modèle et ne servent jamais de série. Chacune a son fond
et sa bordure sourds (`--etat-*-fond`, `--etat-*-bord`) pour les encarts.

**L'accent** est unique par zone. Deux boutons pleins côte à côte, c'est une erreur de
hiérarchie.

## Mise en page

Barre latérale de 232 px sur `--fond-nav`, contenu à 22-26 px de marge (`--e-9`, `--e-10`).
Toute série d'éléments (tuiles, badges, boutons, lignes) se pose en `flex` ou `grid` avec un
`gap` pris dans les tokens d'espacement — jamais des marges au coup par coup, jamais des espaces
de source. Les tuiles de KPI vont par quatre ou cinq sur une ligne ; sous 1 280 px elles passent
à deux colonnes plutôt que de se comprimer. Cibles cliquables ≥ 32 px de haut.

## Formats

| Grandeur | Forme | Exemple |
|---|---|---|
| Montant | espace fine insécable en séparateur de milliers, virgule décimale, `$` suffixé | `1 234,56 $` |
| Tokens | abrégé en millions, une décimale | `125,6 M` |
| Pourcentage signé | signe explicite **et** flèche, jamais le pourcentage seul sans son absolu | `+18 %` |
| Date | jamais une ISO brute à l'écran | `14 mars` |

## Composants de base attendus

Inventaire de `frontend/src/components/ui/`. Un composant n'y monte que s'il sert sur **au moins
deux écrans** ; sinon il reste local. Détail de l'anatomie dans
`.claude/skills/design-system/references/composants.md`.

| Composant | Rôle | Point de vigilance |
|---|---|---|
| `Panneau` | Le conteneur par défaut : `--surface`, bordure `--ligne`, `--rayon` | Pas d'ombre. |
| `Tuile` | Un KPI : micro-label, chiffre 30-34 px mono, unité, `delta` | `delta` porte une flèche **et** un signe. |
| `Badge` | Un modèle, un état, une étiquette neutre | Couleur **plus** libellé, toujours. |
| `Pastille` | Porte l'identité d'une série à côté d'un texte neutre | Le texte reste en couleur de texte. |
| `Tableau` | Colonnes de chiffres comparables | Nombres à droite, mono tabulaire ; jamais de corps vide sans message. |
| `Jauge` | Consommé vs plafond, projection en fantôme | Toujours doublée du libellé d'état. |
| `SegmentControl` | Choix exclusif court (période, unité) | Un seul segment actif. |
| `Onglets` | Bascule de contenu dans un panneau | Soulignement 2 px `--accent`. |
| `Interrupteur` | Un canal d'alerte, un réglage booléen | Libellé cliquable, zone ≥ 32 px. |
| `Curseur` | Un plafond de budget | Jamais seul : valeur chiffrée + boutons −/+ + `aria-label`. |
| `BoutonPrincipal` | L'action de l'écran | **Un seul par écran.** |
| `BoutonFantome` | Toutes les actions secondaires | Bordure `--ligne-forte`. |
| `Encart` | Un verdict, un avertissement | Fond et bordure sourds de l'état, icône à gauche. |
| `EtatVide` | L'état vide obligatoire | Une phrase utile, jamais un tiret. |
| `BandeauErreur` | L'état d'erreur obligatoire | Le message **du backend**, pas un texte générique. |
| `MicroCourbe` | Tendance décorative dans une tuile | Sans axe ni point ; la valeur chiffrée est à côté. |
| `BarresEmpilees` | Composition dans le temps | Voir `references/graphiques.md`. |

Les quatre états — chargement, prêt, vide, erreur — sont obligatoires sur **chaque** écran.

## Anti-patterns, nommément bannis

- Carte blanche flottante à gros rayon et ombre douce.
- Dégradé de fond, dégradé violet, fond translucide flouté, ombre colorée, effet 3D.
- Un rayon supérieur à 3 px.
- Inter, Roboto, Arial. Une deuxième famille de police « pour le fun ».
- Emoji dans l'interface, dans les libellés ou dans les données. Librairie d'icônes ajoutée pour
  trois pictos.
- Une valeur visuelle en dur (`#hex`, `14px`, `border-radius`) hors `tokens.css`.
- Un token nommé par sa couleur (`--bleu-clair`) plutôt que par son rôle.
- Une couleur seule pour dire « ça va mal ». Une couleur d'état réutilisée en série.
- Un pourcentage écrit sans le nombre absolu à côté.
- Une date ISO brute affichée, un chiffre non tabulaire dans une colonne.
- Un graphique à deux axes verticaux, un camembert à plus de trois parts, une valeur écrite sur
  chaque point d'une courbe, une légende absente à deux séries.
- Une micro-animation sur chaque survol : une seule animation par écran, à la révélation.
- `outline: none` sans remplacement visible.

## Écarts assumés à la maquette

Les maquettes sont une intention, `tokens.css` est le contrat. Le §6 du plan tranche trois
points en faveur du système ; voici pourquoi.

1. **La ligne d'un projet porte la couleur de son modèle dominant, pas une couleur par projet.**
   La maquette invente une teinte par projet (violet, ocre…). Le système fige trois couleurs de
   données et interdit d'en ajouter une quatrième : la palette a été validée *en tant que
   triplet* pour le daltonisme, et une quatrième teinte casse cette validation. Surtout, une
   couleur par projet ne dit rien — c'est du décor, et le décor coloré est exactement ce que le
   parti pris refuse. La couleur du **modèle dominant** (`modeleDominant`), elle, est une
   information : on voit d'un coup d'œil quel projet vit sur Opus. L'identité du projet est
   portée par son nom.

2. **Les puces d'agent restent neutres (`--surface-2` + `--texte-2`).** La maquette de session
   emploie cinq teintes pour cinq agents. Même raison : cinq couleurs arbitraires épuisent la
   palette de données, entrent en collision avec les couleurs de modèle et d'état, et
   n'encodent aucune grandeur. Le nom de l'agent porte son identité ; son coût se lit là où il
   est comparable, dans l'onglet « Par agent ».

3. **Le curseur de plafond est toujours doublé de boutons −/+, de la valeur chiffrée et d'un
   `aria-label`.** Un `input[type=range]` seul n'est ni lisible (on ne sait pas quel montant on
   règle) ni réglable au clavier de façon évidente, et un plafond de budget est une valeur qu'on
   pose exactement, pas approximativement. La maquette montre le curseur seul ; le système
   impose l'accompagnement.

Tout le reste — trame gravée 48 px, panneaux `--surface` sans ombre, chiffres mono tabulaires,
accent terre cuite unique, angles à 3 px — est repris tel quel de la maquette.

## Écrans de référence

| Artboard | Écran |
|---|---|
| `design/Main.dc.html` | Tableau de bord — KPI, coût quotidien par modèle, projets |
| `design/Session.dc.html` | Détail d'une session — tours, coût cumulé, agrégats par outil et par agent |
| `design/Budgets.dc.html` | Budgets et alertes — plafonds, projections, seuils, canaux |
| `design/Modeles.dc.html` | Modèles et agents — tarifs, part du cache, simulation de bascule |

Les chiffres qu'on y lit sont des données d'exemple, mais **cohérentes** : tous les coûts y sont
recalculés à partir des quatre compteurs de tokens avec les tarifs de `backend/src/domain/tarifs.ts`.
C'est la règle du produit, et elle vaut aussi pour les maquettes.
