# Revue de US-009 — Répartir une journée en demi-journées

*Revue faite le 2026-08-28 par l'agent `business-analyst`, avant toute conception. Ce document
juge la **demande**, pas la solution. Aucun fichier de `specs/` n'a été modifié.*

## Verdict

**Non prête** — deux manques empêchent d'écrire les tests que la story réclame elle-même : le
sort de deux demi-journées sur la **même** mission n'est pas tranché, et le message de
dépassement, seul résultat observable de son critère, n'est pas fourni.

| | Bloquants | À clarifier | Suggestions |
|---|---|---|---|
| Nombre | 2 | 3 | 2 |

## Les six axes

| Axe | Jugement | Justification |
|---|---|---|
| Compréhensible | Non | Le titre et l'objectif parlent de **répartir** une journée — donc de découper un jour existant — alors que les critères ne décrivent que des ajouts successifs de saisies. Un développeur lit soit « je modifie une saisie », soit « je supprime puis je resaisis », et rien ne tranche. |
| Unitaire | OK | Une seule fonctionnalité : la fraction de journée. Elle touche un champ, une règle de somme et un affichage, tous sur l'écran déjà livré par US-008. Aucun « et » déguisé dans le titre. |
| Testable | Non | Le quatrième critère n'a pour résultat observable qu'« un message indiquant ce qu'il reste de disponible » — message dont ni le texte ni le format du reliquat ne sont donnés. Le test d'acceptation devrait affirmer une chaîne que personne n'a écrite. |
| Complète | Non | Le cas nominal (deux demi-journées, deux missions) et un cas d'erreur (dépassement) sont là. Manquent le passage d'un jour déjà saisi en journée complète vers deux demi-journées, le refus d'une fraction hors `1` et `0,5`, et le cas de deux demi-journées sur la même mission. |
| Bornée | OK | Aucun renvoi vers une story ultérieure ; la story se limite au champ `fraction` et laisse les types d'absence à US-010. Le prérequis US-008 est bien la story immédiatement précédente et fournit l'endpoint réutilisé. |
| Implémentable | Non | La règle de somme est nommée et chiffrée, mais l'indécision sur deux demi-journées d'une même mission empêche de savoir si le jour porte au plus deux lignes ou au plus deux missions — donc d'écrire le test de service que la story exige explicitement, sans passer par HTTP. Aucun libellé français n'est fourni. |

## Constats

### [BLOQUANT] Deux demi-journées sur la même mission : accepté ou refusé ?

> Un jour peut porter deux demi-journées sur deux missions différentes.

> La somme des fractions d'un même jour ne dépasse jamais **1**.

**Ce qui manque :** le critère décrit deux missions **différentes**, la règle métier ne parle que
de la somme. Le cas `0,5 + 0,5` sur la **même** mission satisfait la règle et sort du critère :
il est donc ni autorisé ni interdit. C'est le manque le plus coûteux de la story, parce qu'il
décide de trois choses à la fois — l'unicité ou non du couple (jour, mission) dans une même
journée, le message de refus éventuel, et le contenu du test que la story réclame nommément
(« La règle de somme est vérifiée dans le service, testée sans passer par HTTP »). Tant qu'il
n'est pas tranché, ce test ne peut pas être écrit.

**Question à poser :** deux demi-journées sur la même mission le même jour sont-elles refusées,
au motif qu'il faut alors saisir une journée complète ?

**Reformulation proposée :** « Un jour peut porter deux demi-journées, sur deux missions
différentes. Deux demi-journées sur la même mission le même jour sont refusées avec le message
« Cette mission est déjà saisie sur ce jour : saisissez une journée complète. » »

### [BLOQUANT] Le message de dépassement, seul résultat observable du critère, n'est pas fourni

> Ajouter une saisie qui ferait dépasser 1 sur un jour est refusée, avec un message indiquant ce qu'il reste de disponible.

**Ce qui manque :** le texte français exact, et le format du reliquat. Le critère ne demande pas
seulement un refus — un refus seul serait déjà couvert par US-008 — il demande un message qui
**dit combien il reste** : c'est là toute la valeur ajoutée du critère, et c'est la seule chose
qu'un test puisse observer. Le format n'est pas neutre : US-011 fixe l'écriture française d'une
demi-journée (« 0,5 jour »), la valeur circule sur le fil en `0.5`, et rien ici ne dit laquelle
apparaît à l'écran. Le code HTTP n'est pas redonné non plus : US-008 prévoit `409` « si le jour
est déjà complet », or le cas visé ici est un jour **partiellement** rempli.

**Question à poser :** le refus est-il un `409` portant le message « Il ne reste que 0,5 jour
disponible sur cette journée. » ?

**Reformulation proposée :** « Ajouter une saisie qui ferait dépasser 1 sur un jour est refusée
avec un `409` et le message « Il ne reste que 0,5 jour disponible sur cette journée. », le
reliquat étant écrit en français. »

### [À CLARIFIER] Les deux demi-journées ne sont ni situées ni ordonnées

> Le jour affiche alors les deux missions, chacune pour une demi-journée.

**Ce qui manque :** aucune notion de matin et d'après-midi n'apparaît, et l'ordre d'affichage des
deux missions n'est pas fixé. Le modèle de domaine consigné dans `AGENT.md` va dans le sens de
l'absence de créneau — `CraEntry` y porte « day, type, mission, fraction », sans emplacement —
mais une absence de champ n'est pas une décision écrite, et c'est exactement le genre de point
qu'un développeur tranche seul puis qu'un utilisateur conteste à la démo.

**Question à poser :** les demi-journées sont-elles anonymes, sans matin ni après-midi, affichées
dans leur ordre de saisie ?

**Reformulation proposée :** ajouter en règle métier : « Une demi-journée n'est pas située dans
la journée : il n'y a ni matin ni après-midi. Les deux demi-journées d'un jour s'affichent dans
leur ordre de saisie. »

### [À CLARIFIER] Comment passer d'une journée complète déjà saisie à deux demi-journées

> À la saisie, je peux choisir entre journée complète et demi-journée.

**Ce qui manque :** le geste central annoncé par l'objectif — « répartir une journée entre deux
missions » — n'a pas de critère. Les critères décrivent le choix **au moment de la saisie**, donc
sur un jour vide. Pour un jour déjà porteur d'une journée complète, il faut savoir si le
consultant doit d'abord supprimer sa saisie, ou s'il peut ramener la saisie existante à une
demi-journée. Aucune route de modification n'existe : US-008 n'offre qu'un `POST` et un `DELETE`.

**Question à poser :** pour répartir un jour déjà saisi en journée complète, le consultant
doit-il d'abord supprimer la saisie existante ?

**Reformulation proposée :** ajouter un critère : « Sur un jour déjà saisi en journée complète,
le consultant supprime d'abord la saisie existante, puis saisit deux demi-journées ; aucune
modification directe d'une saisie n'est proposée. »

### [À CLARIFIER] Le refus d'une fraction non autorisée n'est pas décrit

> Les seules fractions autorisées sont **1** et **0,5**.

**Ce qui manque :** ce que répond le serveur à une fraction de `0,25`, `0` ou `2` — un refus de
validation ou un refus métier — et le message associé. Le point est à demi tranché ailleurs :
`backend/app/core/errors.py` traduit déjà le champ `fraction` en « fraction de journée » et
produit, pour une valeur hors ensemble fermé, « Le champ « fraction de journée » a une valeur non
autorisée. ». Reste à confirmer que c'est bien le comportement attendu, et sous quel code.

**Question à poser :** une fraction autre que `1` ou `0,5` est-elle refusée en `422` avec le
message « Le champ « fraction de journée » a une valeur non autorisée. » ?

**Reformulation proposée :** compléter les notes techniques : « Toute fraction autre que `1` ou
`0.5` est refusée en `422` avec le message « Le champ « fraction de journée » a une valeur non
autorisée. » »

### [SUGGESTION] La règle de US-008 devient un cas particulier sans que la story le dise

> La somme des fractions d'un même jour ne dépasse jamais **1**.

**Ce qui manque :** cette règle remplace celle de US-008 — « Une seule journée complète par jour :
une deuxième saisie sur un jour déjà complet est refusée » — qui n'en devient qu'un cas
particulier, celui du reliquat nul. Le message de refus arrêté en US-008 est donc réécrit ici.
Rien ne le dit, et les deux textes cohabiteront dans `specs/` : le développeur qui relit US-008
après coup peut croire la règle toujours en vigueur telle quelle.

**Question à poser :** la règle de somme de US-009 remplace-t-elle intégralement celle de US-008,
message de refus compris ?

**Reformulation proposée :** ajouter en note : « Cette règle généralise celle de US-008, dont le
refus « jour déjà complet » devient le cas où le reliquat est nul. »

### [SUGGESTION] Le mémoire projet annonce pour US-009 des dépendances que la story ne justifie pas

> Même endpoint que US-008, avec un champ `fraction` valant `1` ou `0.5`.

**Ce qui manque :** rien dans la story, ni objectif, ni critère, ni note technique, ne demande un
export. Or `AGENT.md` annonce « reportlab and openpyxl with US-009 ». Un développeur qui suit le
mémoire projet ajoutera deux dépendances inutiles avant d'écrire la première ligne. La
contradiction est dans `AGENT.md`, pas dans `specs/` : elle est signalée ici pour que la story ne
soit pas élargie à tort, et la correction revient au mémoire.

**Question à poser :** confirmez-vous que US-009 ne comporte aucun export PDF ni Excel, et que la
ligne correspondante d'`AGENT.md` est à corriger ?

**Reformulation proposée :** aucune modification de la story ; corriger `AGENT.md` en rattachant
`reportlab` et `openpyxl` à la story qui les demande réellement.

## Prérequis

Le prérequis annoncé, **US-008**, existe, est la story immédiatement précédente, et couvre
effectivement ce que US-009 suppose :

- l'endpoint réutilisé tel quel — « Même endpoint que US-008 » — et son `DELETE .../entrees/{id}`,
  qui rend le cinquième critère (« Chaque demi-journée peut être supprimée indépendamment de
  l'autre ») acquis sans travail supplémentaire, chaque demi-journée étant une entrée à part
  entière avec son identifiant ;
- le sélecteur de mission, la cellule de jour et la distinction visuelle d'un jour vide, sur
  lesquels le double affichage vient se greffer ;
- la règle de propriété — un consultant ne saisit que sur son propre CRA, contrôle serveur — qui
  n'est donc pas à redire ici.

Réserve : la revue de US-008 conclut « À clarifier ». Ses questions ouvertes se propagent
mécaniquement ici — notamment qui crée le CRA du mois et quel code répond un jour non ouvré. Il
faut y répondre avant, ou en même temps ; y répondre après reviendrait à recoder deux fois le
même service.

## Ce que la story établit pour la suite

- La fraction de journée comme grandeur du domaine, avec son ensemble fermé `1` / `0,5` — la seule
  quantité que manipule l'application, tout le reste étant dérivé.
- La règle de somme par jour, que US-010 étend explicitement aux absences (« La règle de somme
  maximale d'un jour s'applique au total travail + absence ») : la trancher ici, une fois,
  dispense de la rejouer là-bas.
- L'affichage d'un jour à plusieurs saisies, dont US-010 hérite pour mélanger mission et absence
  sur un même jour.
- Le comptage à 0,5 dont dépend le récapitulatif de US-011 (« Les demi-journées sont comptées
  pour 0,5 et affichées en français ("0,5 jour") »), et donc le décompte des jours non renseignés
  que US-012 signale avant soumission.
