# Architecture — {{NOM_DU_PROJET}}

*Document généré depuis le dépôt le {{DATE}}. Chaque affirmation est tirée du code, des notes
de conception ou d'une exécution réelle des tests ; ce qui est conçu mais pas encore construit
est marqué **planifié**.*

<!-- Remplir chaque section depuis le dépôt. Ne jamais supprimer une section : si elle est
     sans objet, écrire une ligne qui le dit et pourquoi. Ne jamais en ajouter non plus —
     ce document se compare d'une version à l'autre. -->

## 1. Le projet en une page

<!-- Source : AGENT.md. Ce que fait l'application, pour qui, en cinq lignes maximum. -->

{{RESUME}}

| Rôle | Ce qu'il fait |
|---|---|
| {{ROLE}} | {{RESPONSABILITES}} |

## 2. Stack et structure

<!-- Source : versions RÉELLEMENT installées (package.json, uv pip list), pas la stack rêvée. -->

| Côté | Technologies |
|---|---|
| Frontend | {{STACK_FRONTEND}} |
| Backend | {{STACK_BACKEND}} |
| Base de données | {{STACK_BDD}} |
| Qualité | {{STACK_QUALITE}} |

```
{{ARBORESCENCE}}
```

## 3. Vue d'ensemble

<!-- Source : configuration (proxy, ports, CORS). Un schéma en texte, pas une image. -->

```
{{SCHEMA_DEPLOIEMENT}}
```

{{FLUX_ET_IDENTITE}}

## 4. Modèle de domaine

<!-- Source : models/. Séparer ce qui est construit de ce qui est planifié. -->

| Entité | Rôle | Champs structurants |
|---|---|---|
| {{ENTITE}} | {{ROLE_ENTITE}} | {{CHAMPS}} |

| Invariant | Appliqué dans |
|---|---|
| {{INVARIANT}} | {{LIEU_APPLICATION}} |

## 5. Contrat d'API

<!-- Source : routers/ ou /openapi.json si le serveur tourne. Une ligne par route réelle. -->

| Route | Verbe | Statut | Rôle requis |
|---|---|---|---|
| {{ROUTE}} | {{VERBE}} | {{STATUT}} | {{ROLE_REQUIS}} |

{{CONTRAT_ERREUR}}

## 6. Frontend

<!-- Source : src/. Le découpage en couches, les écrans en place, les conventions d'UI. -->

```
{{COUCHES_FRONTEND}}
```

{{ECRANS_ET_CONVENTIONS}}

## 7. Décisions d'architecture

<!-- Source : docs/adr/. Reproduire les statuts tels quels, y compris les ADR remplacées. -->

| ADR | Titre | Statut | Décision |
|---|---|---|---|
| {{NUMERO}} | {{TITRE_ADR}} | {{STATUT_ADR}} | {{DECISION}} |

## 8. Qualité

<!-- Source : exécution réelle des suites, avec la date. Jamais de chiffre de mémoire. -->

| Côté | Tests | Couverture |
|---|---|---|
| {{COTE}} | {{NB_TESTS}} | {{COUVERTURE}} |

{{GARDE_FOUS}}

## 9. Ce qui reste à construire

<!-- Source : specs/ moins ce qui existe dans le code. -->

| Stories | Sujet |
|---|---|
| {{STORIES}} | {{SUJET}} |

{{IMPACT_A_VENIR}}
