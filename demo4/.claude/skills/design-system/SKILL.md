---
name: design-system
description: Design system du Tokenomètre — tokens, composants d'interface, règles de graphique et de mise en page. À charger AVANT d'écrire ou de modifier le moindre écran, composant, couleur, espacement, police ou visualisation sous frontend/. Utiliser aussi pour ajouter un token, créer un composant de base, vérifier une maquette, ou juger si un écran respecte le système.
---

# Design system — Tokenomètre

Le système tient en trois fichiers. **Tu les lis avant d'écrire du CSS ou du JSX**, et tu ne
crées jamais une valeur visuelle qui n'y figure pas.

| Fichier | Rôle |
|---|---|
| `frontend/src/styles/tokens.css` | **La seule source de vérité** des couleurs, polices, tailles, espacements, rayons. |
| `frontend/src/components/ui/` | Les composants de base. Tout écran se compose d'abord avec eux. |
| `docs/design/DESIGN.md` | Le *pourquoi* : parti pris, typographie, usages de couleur, anti-patterns. |

La maquette de référence vit dans le canvas Claude Design (`design/*.dc.html` à la racine de
`demo4/`). En cas de désaccord entre la maquette et les tokens, **les tokens gagnent** : la
maquette est une intention, `tokens.css` est le contrat.

## Le parti pris, en une phrase

Une **console d'instruments** : fond graphite gravé, panneaux sobres aux angles presque vifs,
chiffres en monospace tabulaire qui s'alignent en colonnes, un seul accent terre cuite, et des
couleurs de données réservées aux données. Pas de carte blanche flottante, pas de dégradé
violet, pas d'emoji, pas d'Inter.

## Procédures

### Ajouter ou modifier un écran

1. Liste les éléments de l'écran et trouve, pour chacun, le composant existant dans
   `components/ui/`. S'il n'en existe pas, va au §suivant avant d'écrire du JSX.
2. Mets en page avec **flex ou grid + `gap`** pris dans les tokens d'espacement. Jamais de
   marge au coup par coup pour espacer une série d'éléments, jamais d'espacement par des
   espaces de source.
3. Les chiffres portent la classe tabulaire monospace, les libellés courts en micro-label
   (mono, majuscules, interlettrage). Les montants : `1 234,56 $`. Les tokens : `125,6 M`.
4. Les quatre états sont obligatoires : chargement, prêt, vide, erreur. L'état vide porte une
   phrase utile, pas un tiret.
5. Vérifie à 1 280 px ET à 1 440 px : rien ne doit déborder horizontalement, aucune colonne de
   chiffres ne doit se désaligner.

### Créer un composant de base

Un nouveau composant dans `components/ui/` se justifie seulement s'il apparaît sur **au moins
deux écrans**. Sinon, il reste local à l'écran.

1. Un fichier `Nom.tsx` + `Nom.module.css`, exporté depuis `components/ui/index.ts`.
2. Props typées, aucune valeur visuelle en dur : tout passe par `var(--…)`.
3. Les variantes sont un `variant`/`tone` typé, pas un booléen par cas.
4. Un test dans `frontend/tests/ui/` : rendu par défaut, chaque variante, état désactivé ou
   vide, accessibilité du rôle et du libellé.
5. Documente-le dans le tableau de `docs/design/DESIGN.md`.

### Ajouter un token

On ajoute un token quand une valeur sert **trois fois ou plus**, ou quand elle porte un sens
métier (un modèle, un état de budget). Sinon on réutilise le token le plus proche.

1. Nomme par le **rôle**, jamais par l'apparence : `--etat-depassement`, pas `--rouge-2`.
2. Place-le dans la bonne section de `tokens.css` (encre/surface, texte, accent, données,
   états, espacement, typographie, rayon).
3. Une couleur de données ou d'état se valide avant d'être posée : voir la règle ci-dessous.
4. Note l'ajout dans `docs/design/DESIGN.md` dans le même commit.

### Faire un graphique

Voir `references/graphiques.md` — forme d'abord, couleur en dernier. Les trois couleurs de
modèle sont figées et validées pour le daltonisme ; elles ne servent **qu'**à désigner un
modèle, jamais de décor.

## Règles non négociables

1. **Aucune valeur visuelle hors tokens.** Pas un `#hex`, pas un `14px`, pas un `border-radius`
   littéral dans un composant ou un écran. Seule exception : les couleurs de séries d'un
   graphique, qui doivent rester des littéraux lisibles par l'outil de validation — elles sont
   listées dans `references/graphiques.md`.
2. **Jamais la couleur seule.** Un état de budget, une sévérité, un modèle : toujours un
   libellé ou une icône à côté de la pastille.
3. **Les chiffres sont tabulaires.** `font-variant-numeric: tabular-nums` sur tout nombre
   comparé dans une colonne ou une tuile.
4. **Les icônes sont du SVG en ligne**, trait de 1,6 à 2,2 px sur une grille 16/20/24. Jamais
   d'emoji, jamais de glyphe décoratif, jamais une librairie d'icônes ajoutée pour trois
   pictos.
5. **Une seule animation par écran** au maximum, et seulement à la révélation. Pas de
   micro-interaction partout.
6. **Cibles cliquables ≥ 32 px de haut** sur desktop, ≥ 44 px si l'écran est pensé pour le
   tactile. Focus clavier toujours visible, jamais `outline: none` sans remplacement.
7. **Les couleurs d'état sont réservées** (dans le budget, à surveiller, limite atteinte,
   dépassement). Elles ne servent jamais de « quatrième couleur de série ».
8. **Le texte porte des couleurs de texte**, jamais la couleur d'une série : la pastille
   colorée à côté suffit à porter l'identité.

## Checklist de revue d'un écran

- [ ] Zéro couleur, taille, police ou rayon littéral hors `tokens.css`.
- [ ] Tout ce qui existait dans `components/ui/` a été réutilisé ; les nouveaux composants y
      sont remontés si un deuxième écran les emploie.
- [ ] Espacements par `gap` + tokens ; rien ne déborde à 1 280 px.
- [ ] Chiffres tabulaires et alignés à droite dans les tableaux ; format français, devise `$`.
- [ ] Chaque information d'état a un libellé ou une icône en plus de sa couleur.
- [ ] Chargement, vide, erreur traités — avec le message du backend pour l'erreur.
- [ ] Focus clavier visible, ordre de tabulation sensé.
- [ ] Aucun graphique à deux axes verticaux ; légende présente dès deux séries.

## Références

- `references/tokens.md` — le tableau des tokens et leur usage, rôle par rôle.
- `references/composants.md` — l'inventaire des composants de base, leur anatomie et leurs
  états.
- `references/graphiques.md` — formes, couleurs de séries validées, règles d'axes, de légende
  et d'infobulle.
