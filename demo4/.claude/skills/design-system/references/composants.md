# Composants de base

Inventaire de `frontend/src/components/ui/`. Un composant marqué *à créer* n'existe pas encore :
c'est la liste des pièces que les écrans du Tokenomètre réclament. Créer exactement celles dont
l'écran a besoin, pas la collection entière.

| Composant | Props | Anatomie et règles |
|---|---|---|
| `Panneau` | `titre?`, `actions?`, `children` | Surface `--surface`, bordure `--ligne`, rayon `--rayon`, **pas d'ombre**. Titre 14 px/600, sous-titre optionnel en 11 px `--texte-4`. |
| `Tuile` | `libelle`, `valeur`, `unite?`, `delta?`, `tonalite?`, `children?` | Micro-label en haut, chiffre 30-34 px mono tabulaire, unité en 13 px `--texte-3` collée au chiffre. `delta` porte une flèche **et** un signe. La zone `children` accueille une jauge ou une micro-courbe. |
| `Badge` | `tonalite: modele \| etat \| neutre`, `icone?`, `children` | Hauteur 20-22 px, rayon `--rayon-2`, mono 10 px. Couleur **plus** libellé, toujours. |
| `Pastille` | `couleur`, `taille?` | Carré de 8-9 px, rayon `--rayon-2`. Sert à porter l'identité d'une série à côté d'un texte neutre. |
| `Tableau` | `colonnes`, `lignes`, `messageVide`, `cleLigne`, `onLigneClic?` | Grille CSS, en-têtes en micro-label, séparateurs `--ligne`. Nombres alignés à droite en mono. Ligne sélectionnée : fond `--surface-2` + liseré `--accent` de 2 px à gauche. **Jamais de corps vide sans message.** |
| `Jauge` | `valeur`, `plafond`, `projection?`, `tonalite` | Piste `--surface-2`, remplissage de la tonalité d'état. Si `projection` est fourni, elle se dessine en arrière-plan à 30 % d'opacité : le consommé est net, la projection est fantôme. |
| `SegmentControl` | `options`, `valeur`, `onChange` | Boutons joints, bordure commune `--ligne-forte`, hauteur 34 px, mono 11 px. Segment actif : fond `--accent-sourd`, texte `--accent-clair`. Un seul choix actif. |
| `Onglets` | `options`, `valeur`, `onChange` | Soulignement de 2 px `--accent` sous l'onglet actif, texte `--texte-3` → `--texte` à l'activation. |
| `Interrupteur` | `actif`, `libelle`, `detail?`, `onChange` | Piste 38×20, molette 14 px. Libellé cliquable avec la piste, zone de clic ≥ 32 px de haut. |
| `Curseur` | `min`, `max`, `pas`, `valeur`, `onChange` | Piste 4 px, poignée 16 px bordée `--accent`. Toujours accompagné de la valeur chiffrée lisible **et** de boutons −/+ : un curseur seul n'est pas réglable au clavier de façon évidente. |
| `BoutonPrincipal` | `children`, `icone?`, `disabled?` | Fond `--accent`, texte très sombre, hauteur 36 px. **Un seul par écran.** |
| `BoutonFantome` | `children`, `icone?` | Transparent, bordure `--ligne-forte`, hauteur 34 px. Toutes les actions secondaires. |
| `Encart` | `tonalite: etat`, `icone`, `children` | Fond et bordure sourds de l'état, icône à gauche, texte 12,5 px `--texte-2`, interligne 1,55. Sert aux verdicts et aux avertissements. |
| `EtatVide` | `titre`, `detail?`, `action?` | Phrase utile, jamais un tiret ni « aucune donnée ». |
| `BandeauErreur` | `message`, `onReessayer?` | Affiche le message **du backend**, pas un texte générique. |
| `MicroCourbe` | `valeurs`, `couleur?` | SVG en ligne, trait 2 px, sans axe ni point. Décorative : la valeur chiffrée est à côté. |
| `BarresEmpilees` | `series`, `max`, `onSelection?` | Voir `graphiques.md` : écart de 2 px entre segments, extrémité haute arrondie de 2 px, infobulle au survol. |

## Conventions communes

- **Props, pas de variantes cachées** : pas de `className` passé de l'extérieur pour modifier
  l'apparence. Si un écran a besoin d'autre chose, c'est une variante typée ou un composant
  local.
- **Libellés en props**, jamais codés dans le composant : les textes vivent dans
  `src/labels.ts`.
- **Les composants ne formatent pas les nombres.** Ils reçoivent des chaînes déjà formatées par
  `src/format.ts`, ou un nombre et un format nommé — jamais `toFixed` au milieu du JSX.
- **Aucun appel réseau** dans un composant de `ui/` : ils sont purs, testables sans serveur.
- **États interactifs obligatoires** : repos, survol, focus visible, actif, désactivé. Le focus
  ne disparaît jamais sans remplacement visible.
- Chaque composant a son test dans `frontend/tests/ui/` : rendu par défaut, chaque variante, le
  cas vide ou désactivé, le rôle et le libellé accessibles.
