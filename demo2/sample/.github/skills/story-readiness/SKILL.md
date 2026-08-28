---
name: story-readiness
description: Use BEFORE designing or coding a user story, to check it is understandable, testable and complete enough to implement. Delegates to the business-analyst agent and writes one readiness report per story under docs/revues/. Run it on a single story, or on the whole backlog before starting a phase.
---

# Story readiness

Answers one question, before a single line of code: **peut-on implémenter cette story
telle qu'elle est écrite, ou faudra-t-il deviner ?**

Deviner coûte cher tard. Un critère ambigu se règle en une phrase avant de coder, et en une
demi-journée de reprise après. C'est la seule étape du dispositif où le *besoin* est
contesté — `architect` conçoit, `cra-reviewer` relit le code, personne d'autre ne relit la
demande.

## Qui fait le travail

L'agent **`business-analyst`**, en lecture seule sur `specs/`. Lui donner l'identifiant de
la story ; il juge les six axes et produit le rapport. Ne pas faire ce travail dans la
conversation principale : l'agent a son propre modèle et son propre cadrage, et il ne doit
pas être contaminé par le contexte de développement.

## Déroulé

1. **Une story ou tout le backlog.** Pour une phase entière, lancer un agent par story —
   elles sont indépendantes, donc les revues sont parallélisables.
2. **L'agent lit** la story, son prérequis, le README et le code déjà en place, puis remplit
   `template/revue.md`.
3. **Le rapport atterrit** dans `docs/revues/US-0XX-revue.md`, puis est **rendu en PDF**
   (voir plus bas) : le Markdown reste la source versionnee, le PDF est ce qu'on transmet.
4. **Le verdict décide de la suite :**

| Verdict | Suite |
|---|---|
| **Prête** | enchaîner sur `/speckit.specify` et `architect` |
| **À clarifier** | poser les questions au rédacteur de la story ; la réponse va dans `specs/`, écrite par un humain |
| **Non prête** | ne pas lancer la conception : on ne saurait pas écrire les tests d'acceptation |

5. **Après correction de la story**, relancer la revue : le rapport est daté et remplacé.

## Ce que le skill ne fait pas

- Il **ne modifie jamais `specs/`.** Une reformulation est une proposition, pas une
  correction appliquée. La story appartient au client.
- Il ne conçoit pas : ni route, ni table, ni bibliothèque. Une revue qui commence à
  concevoir cesse de juger la demande et se met à juger sa propre solution.
- Il ne cherche pas à rendre toutes les stories « Prêtes ». Un backlog dont chaque story
  passe du premier coup signale une revue complaisante, pas un backlog parfait.

## Lancer la revue

```text
Utilise le skill story-readiness sur specs/US-009-demi-journees.md :
délègue à l'agent business-analyst et écris son rapport dans docs/revues/.
```

Sur un lot :

```text
Revois les stories US-007 à US-011 avec le skill story-readiness, un agent
business-analyst par story, en parallèle. Donne-moi ensuite le tableau des verdicts.
```

## Rendu PDF

Le rapport livre est un **PDF** : `docs/revues/US-0XX-revue.pdf`. Le `.md` reste dans le
depot comme source, le PDF est ce qui circule — il se lit sans outil et se joint a un
ticket ou a un mail.

```bash
STORY=US-009   # l'identifiant de la story

uv run --with markdown-it-py python .claude/skills/story-readiness/template/render.py "$STORY"

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/revues/$STORY-revue.pdf" "file://$PWD/docs/revues/$STORY-revue.html"

rm "docs/revues/$STORY-revue.html"
```

Le moteur doit etre **CommonMark** : `python-markdown` casse les blocs de code imbriques et
transforme les citations de criteres en prose. La feuille de style est livree avec le skill
(`template/print.css`) — identique a celle du skill `architecture-pdf`, pour que tous les
documents du projet se ressemblent.

Sur un lot, boucler sur les identifiants et **annoncer le nombre de pages de chaque PDF** :
un rapport d'une seule page signale souvent un template mal rempli.

## Restituer un lot

Après un lot, produire un tableau de synthèse — c'est lui qu'on regarde, pas les rapports :

| Story | Verdict | Bloquants | À clarifier |
|---|---|---|---|
| US-007 | Prête | 0 | 0 |
| US-008 | À clarifier | 0 | 2 |

## Checklist

- [ ] Un rapport par story, construit depuis `template/revue.md`, daté.
- [ ] Chaque rapport rendu en PDF dans `docs/revues/`, le `.md` conservé comme source.
- [ ] Nombre de pages relevé pour chaque PDF, et rendu vérifié sur au moins un d'entre eux.
- [ ] Les six axes jugés et justifiés dans chaque rapport.
- [ ] Chaque constat cite le critère mot pour mot et propose une reformulation.
- [ ] Aucun fichier de `specs/` modifié.
- [ ] Verdict cohérent avec les constats, et tableau de synthèse si le lot dépasse une story.
