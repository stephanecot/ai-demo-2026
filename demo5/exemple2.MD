Tu vas reconstruire une interface à partir d'une simple capture d'écran, en direct
devant un public.

**La maquette** : `interface.png` (1265 × 925) — le tableau de bord d'un portail ERP
ancienne génération. C'est ta seule spécification.
**La sortie** : `result/index.html` + `result/styles.css`, rien d'autre.

**Étape 1 — Lis la maquette.** Ouvre l'image et fais-moi l'inventaire : les zones, la
grille, le nombre de blocs, la palette (donne-moi les hex), la typo, les tailles, la
densité. Repère les motifs qui se répètent — ici, un même « bandeau de widget » revient
partout. Ne code encore rien.

**Étape 2 — Construis.** HTML + CSS statiques, aucune dépendance réseau, aucun
framework. Les icônes et pictogrammes sont refaits en SVG inline ou en CSS. **Interdit
d'utiliser `interface.png`, ou un découpage de cette image, comme contenu de la page** :
on reconstruit, on ne colle pas une capture. Reprends les textes et les données visibles
dans la maquette, à l'identique. Largeur de travail : 1265 px.

**Étape 3 — Regarde ton propre travail.** Pas de serveur, et pas l'extension : elle
refuse les URL `file://`. Capture la page en 1265 × 925 exactement avec Chrome en mode
headless, puis ouvre l'image et regarde-la.

```
chrome --headless --window-size=1265,925 --force-device-scale-factor=1 --hide-scrollbars
       --screenshot="C:/.../demo5/result/rendu.png" "file:///C:/.../demo5/result/index.html"
```

La page doit donc rester autonome : aucun `fetch`, aucun module JS, aucune ressource
externe.

**Étape 4 — Mesure l'écart.** Lance `python compare.py interface.png result/rendu.png`.
Annonce-moi le score, puis ouvre `result/diff.png` : les zones rouges sont tes écarts.
Traite-les par ordre de surface — une colonne décalée coûte cent fois plus qu'une police
mal crénée. Zoome dans le navigateur sur les régions concernées pour comprendre avant de
corriger.

**Étape 5 — Itère.** Trois tours maximum : corriger → recapturer → remesurer, en
annonçant le score à chaque tour. Arrête-toi plus tôt si la carte des écarts ne montre
plus que du texte (c'est de l'anti-crénelage, on ne le rattrapera pas).

**Étape 6 — Rends des comptes.** Un tableau zone par zone : *conforme · écart assumé ·
non reproduit*, avec le score de départ et le score final. Dis-moi franchement ce que tu
n'as pas su refaire — je préfère une ligne « non reproduit » qu'une approximation vendue
comme finie.

Règles : une ligne de commentaire par action, pas de pavé. Ne déclenche jamais de
`alert()` / `confirm()`. Si un outil navigateur échoue deux fois, arrête-toi et
dis-le-moi.
