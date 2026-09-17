# demo5 — Claude en démo publique

Trois prompts, à copier-coller tels quels. Le fichier = le prompt, rien d'autre.

| Fichier | Démo | Durée | Prérequis |
|---------|------|-------|-----------|
| `exemple1.MD` | Auditer et corriger une page cassée (a11y + rendu) via Chrome DevTools | 6-8 min | aucun : la page s'ouvre en `file://` |
| `exemple2.MD` | Reconstruire un écran legacy au pixel près depuis `interface.png` | 8-12 min | `today/` vide, Chrome installé (capture headless) |
| `exemple3.MD` | Maquetter une app mobile avec Claude Design | 4-5 min | `/design-login` fait |

## Lancer

Aucun serveur : les deux démos navigateur ouvrent leur page en `file://`.

```bash
rm -rf today/* && mkdir -p today     # les trois exemples écrivent dans today/
```

Rien d'autre à lancer : `site/index.html` s'ouvre directement.

Ni l'une ni l'autre ne passe par l'extension Claude in Chrome : elle refuse les URL
`file://`. L'exemple 1 pilote le navigateur par les outils Chrome DevTools ; pour
l'exemple 2 la capture est prise par Chrome en mode headless (exactement 1265 × 925, ce
qui rend la comparaison pixel possible).

## Remettre à zéro entre deux passages

```bash
rm -rf today/*        # suffit : `site/` n'est jamais modifié, la correction de
                      # l'exemple 1 est écrite dans today/exemple1/site/
```

## Où atterrit la réalisation

Les prompts produisent leur réalisation dans `today/exemple1|2|3/`. C'est ce dossier
qu'on montre pendant la démo.

`result/` contient une exécution réelle des trois prompts, gardée comme filet de
sécurité : `result/exemple1/` (rapport d'audit + page corrigée), `result/exemple2/`
(reconstruction, `rendu.png`, `diff.png`, score 76,1 %), `result/exemple3/` (artboards
et lien du canevas). Chaque dossier a son `rapport.md`. Les trois prompts disent
explicitement de ne pas l'ouvrir : il contient la solution. **À sortir seulement si une
démo cale.**

## Fichiers

- `site/` — page vitrine « Vélocité », volontairement cassée (exemple 1).
- `CORRIGE.md` — les 29 défauts plantés, avec fichier:ligne et correctif. **Ne pas
  montrer pendant la démo, ne pas donner à Claude.**
- `interface.png` — capture d'un portail ERP legacy (exemple 2).
- `compare.py` — score de fidélité pixel + carte des écarts :
  `python compare.py interface.png today/exemple2/rendu.png --sortie today/exemple2/diff.png`
- `today/` — sortie des trois exemples, à vider avant chaque passage.
- `result/` — exécution de référence, à ne pas montrer ni donner à Claude.

## À dire pendant l'exemple 1

Les huit défauts flagrants (clignotement, bandeau défilant, image de texte, cookies
blanc sur jaune, astérisques rouges seuls, mentions en 9 px, `aria-hidden` sur les
coordonnées) sont ceux que la salle repère elle-même : faites-la chercher avant Claude.
Les quatre qu'il rate le plus souvent — `tabindex` positifs, état porté par la couleur
seule, en-tête sticky transparent, viewport figé — servent à conclure : l'outil accélère
la revue, il ne la remplace pas.

## À dire pendant l'exemple 2

Premier tour : 55-70 % de pixels conformes. Dernier : 80-90 %. On ne fera pas 100 %,
deux moteurs de rendu ne donnent jamais le même pixel. C'est la carte des écarts qui
raconte l'histoire, pas le pourcentage. Enchaînement le plus vendeur si le temps le
permet : « maintenant refais cet écran en 2026, même contenu, charte moderne ».
