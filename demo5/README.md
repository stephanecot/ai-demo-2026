# demo5 — Claude en démo publique

Trois prompts, à copier-coller tels quels. Le fichier = le prompt, rien d'autre.

| Fichier | Démo | Durée | Prérequis |
|---------|------|-------|-----------|
| `exemple1.MD` | Auditer et corriger une page cassée (a11y + rendu) via le plugin Chrome | 6-8 min | page servie sur 4173 |
| `exemple2.MD` | Reconstruire un écran legacy au pixel près depuis `interface.png` | 8-12 min | `result/` vide, Chrome installé (capture headless) |
| `exemple3.MD` | Maquetter une app mobile avec Claude Design | 4-5 min | `/design-login` fait |

## Lancer

```bash
python -m http.server 4173 --directory site     # exemple 1
rm -rf result/* && mkdir -p result              # exemple 2 : pas de serveur, la page
                                                # s'ouvre en file:// depuis result/
```

Autoriser `localhost` dans l'extension Claude avant de commencer, sinon la démo cale sur
le premier outil navigateur. L'exemple 2 ne passe pas par l'extension : elle refuse les
URL `file://`, la capture est prise par Chrome en mode headless (exactement 1265 × 925,
ce qui rend la comparaison pixel possible).

## Remettre à zéro entre deux passages

```bash
git restore site      # exemple 1 : remet les 29 défauts en place
rm -rf result/*       # exemple 2
```

## Résultats de référence

`result/` contient une exécution réelle des trois prompts, à garder comme filet de
sécurité : `result/exemple1/` (rapport d'audit + page corrigée), `result/exemple2/`
(reconstruction, `rendu.png`, `diff.png`, score 76,1 %), `result/exemple3/` (artboards
et lien du canevas). Chaque dossier a son `rapport.md`.

## Fichiers

- `site/` — page vitrine « Vélocité », volontairement cassée (exemple 1).
- `CORRIGE.md` — les 29 défauts plantés, avec fichier:ligne et correctif. **Ne pas
  montrer pendant la démo, ne pas donner à Claude.**
- `interface.png` — capture d'un portail ERP legacy (exemple 2).
- `compare.py` — score de fidélité pixel + carte des écarts :
  `python compare.py interface.png result/rendu.png`
- `result/` — sortie de l'exemple 2.

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
