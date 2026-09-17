Tu vas auditer puis corriger une page web, en direct devant un public.

**La cible** : `demo5/site/index.html`, une page vitrine statique ouverte directement en
`file://` — aucun serveur, aucun build. `site/` est en lecture seule : il sert au
passage suivant.
**La sortie** : `today/exemple1/` — tu y copieras la page pour la corriger, et tu y
déposeras ton rapport. Ne regarde pas `result/`, c'est une exécution de référence.

**Étape 1 — Regarde.** Ouvre la page dans un nouvel onglet Chrome avec les outils Chrome
DevTools (l'extension Claude in Chrome refuse les URL `file://`, passe par DevTools),
prends une capture pleine page et lis le DOM. Décris-moi en trois phrases ce que fait
cette page.

**Étape 2 — Audite.** Cherche deux familles de défauts, et appuie chaque constat sur ce
que tu vois dans le navigateur, pas sur une lecture du code :

- **accessibilité** (WCAG 2.2 AA) : nom accessible des contrôles, images, libellés de
  formulaire, hiérarchie des titres, langue du document, navigation au clavier et
  visibilité du focus, contraste, information portée par la couleur seule, sémantique du
  tableau, intitulés de liens, contenus animés ou clignotants, texte présenté sous forme
  d'image, bandeaux qui recouvrent le contenu ;
- **rendu graphique** : débordements, texte coupé, éléments rognés ou superposés,
  alignements et espacements incohérents, comportement en fenêtre étroite.

Pour le clavier, fais réellement le test : `Tab` depuis le haut de la page, et dis-moi à
chaque arrêt où se trouve le focus et s'il est visible. Redimensionne aussi la fenêtre en
390 × 800 et reprends une capture.

Rends-moi un tableau : *défaut · où · pourquoi c'est un problème · gravité (bloquant /
majeur / mineur)*. Classe les bloquants en premier. Ne corrige rien encore.

**Étape 3 — Corrige.** Quand je te dis « go », copie tout `site/` dans
`today/exemple1/site/` (HTML, CSS et SVG), puis applique les corrections là-bas, dans
`index.html` et `styles.css` uniquement. Contraintes : pas de framework, pas de librairie d'icônes,
on reste en HTML + CSS ; tous les chemins restent relatifs pour que la page continue de
s'ouvrir en `file://` ; le rendu doit rester visuellement proche de l'original (on
répare, on ne redessine pas) ; tous les textes restent en français.

**Étape 4 — Re-vérifie dans le navigateur.** Ouvre `today/exemple1/site/index.html`,
reprends les mêmes captures (pleine page 1280 et 390 × 800), refais le parcours au
clavier, et prouve-moi point par point que chaque défaut du tableau est réglé. S'il en
reste un, dis-le franchement plutôt que de l'enterrer. Écris le tableau d'audit et ce
bilan dans `today/exemple1/rapport.md`.

Règles : commente ce que tu fais au fur et à mesure, une ligne par action. Ne déclenche
jamais de `alert()` / `confirm()` dans la page. Si un outil navigateur échoue deux fois
de suite, arrête-toi et dis-le-moi.
