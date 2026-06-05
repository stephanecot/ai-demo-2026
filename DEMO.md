# Agentic Demo — Spec Kit walkthrough (~30 min)

🇫🇷 [Version française](#fr) · 🇬🇧 [English version](#en)

> The prompt to paste into `/speckit-specify` is in French in the French version
> and in English in the English version — use the one matching your demo.

---

<a id="fr"></a>
# 🇫🇷 Version française

Une feature courte et autonome pour démontrer tout le flux agentique sur ce repo
(spec → plan → tasks → implement), en exerçant les skills, les rules et les
subagents `spring-boot-dev` / `angular-dev` de bout en bout.

Le modèle produit a déjà `reference`, `name`, `description`, `category`,
`unitPrice`, `quantity`, avec un CRUD **sans suppression** (le data-model dit
explicitement *« No delete in this increment »*). La suppression est donc
l'incrément suivant, naturel et clairement borné :

- C'est littéralement « la prochaine étape » documentée → scope évident.
- Vraie tranche full-stack : force le `spring-boot-dev` (endpoint DELETE +
  service + 404) **et** le `angular-dev` (bouton + dialog de confirmation +
  refresh de la liste).
- Montre plein de skills d'un coup : service-layer, rest-api, a11y (dialog
  accessible + gestion du focus), i18n (libellés traduisibles), tests des deux
  côtés.
- Petit et borné → l'`implement` a le temps de finir.

## Prompt à lancer (`/speckit-specify`)

```
Permettre à un opérateur de magasin de supprimer un produit du catalogue.

Depuis la liste des produits (action sur la ligne) comme depuis la vue détail,
l'utilisateur peut supprimer un seul produit. Le clic sur « supprimer » ouvre une
boîte de dialogue de confirmation accessible qui affiche le nom et la référence du
produit, indique que l'action est irréversible, et propose « Annuler » et
« Confirmer ». La boîte de dialogue piège le focus, se ferme avec Échap, et rend
le focus à l'élément déclencheur à sa fermeture.

Règle métier : un produit ne peut être supprimé que s'il est en rupture de stock
(quantity à 0). Tenter de supprimer un produit qui a encore du stock (quantity > 0)
est refusé avec une erreur de conflit claire expliquant pourquoi ; l'UI l'affiche
comme une notification d'erreur et conserve le produit. Supprimer un produit qui
n'existe plus renvoie une erreur not-found.

En cas de succès, le produit est retiré de la liste sans rechargement complet de la
page, et une notification de succès nomme le produit supprimé. Pendant la requête,
le bouton de confirmation affiche un état de chargement et est désactivé pour éviter
les double-soumissions. Quand la liste devient vide, afficher un état vide convivial.

Limites de périmètre pour rester simple : un produit à la fois, pas de soft-delete,
pas de piste d'audit, pas de suppression en masse, pas de restauration/undo. Rester
cohérent avec le CRUD produit existant, garder tous les nouveaux textes d'UI
traduisibles (multilingue), et couvrir le tout par des tests backend (cas nominal,
404 not-found, conflit quand il reste du stock) et frontend (ouverture/confirmation/
annulation du dialog, notifications succès et erreur, état vide).
```

> Astuce démo : prévoir au moins un produit à **stock 0** (supprimable) et un
> produit **avec du stock** (suppression bloquée) pour montrer la règle métier en
> direct — d'abord l'erreur de conflit, puis la suppression réussie.

## Déroulé (~30 min)

1. `/speckit-specify` + le prompt → **spec.md** (~3 min, montre la génération)
2. `/speckit-plan` → plan + artefacts de design (~4 min)
3. `/speckit-tasks` → tasks.md ordonné (~2 min)
4. `/speckit-implement` → les subagents codent back + front + tests (~12–15 min)
5. `.\start.ps1` et démo du résultat en live (~5 min)

> Astuce : la suppression rend la magie « rules/skills respectés » très visible
> (DTO, `ProblemDetail` 404, dialog a11y, Vitest, i18n) sans risque de déborder.

---

<a id="en"></a>
# 🇬🇧 English version

A short, self-contained feature to demo the full agentic flow on this repo
(spec → plan → tasks → implement), exercising the project's skills, rules, and
the `spring-boot-dev` / `angular-dev` subagents end to end.

The product model already has `reference`, `name`, `description`, `category`,
`unitPrice`, `quantity`, with a CRUD that has **no delete yet** (the data model
explicitly states *"No delete in this increment"*). So delete is the natural,
clearly-scoped next step:

- It is literally the documented "next step" → obvious scope.
- A real full-stack slice: forces `spring-boot-dev` (DELETE endpoint + service +
  404) **and** `angular-dev` (button + confirmation dialog + list refresh).
- Shows many skills at once: service-layer, rest-api, a11y (accessible dialog +
  focus management), i18n (translatable labels), tests on both sides.
- Small and bounded → `implement` has time to finish.

## Prompt to run (`/speckit-specify`)

```
Allow a store operator to delete a product from the catalog.

From both the product list (a row action) and the product detail view, the user
can delete a single product. Clicking delete opens an accessible confirmation
dialog that shows the product's name and reference, states the action is
irreversible, and offers Cancel and Confirm; the dialog traps focus, can be
dismissed with Escape, and returns focus to the triggering element when closed.

Business rule: a product can only be deleted when it is out of stock (quantity is
0). Attempting to delete a product that still has stock (quantity > 0) is rejected
with a clear conflict error explaining why; the UI surfaces it as an error
notification and keeps the product. Deleting a product that no longer exists
returns a not-found error.

On success, the product is removed from the list without a full page reload, and a
success notification names the deleted product. While the request is in flight, the
confirm button shows a loading state and is disabled to prevent double submits. When
the list becomes empty, show a friendly empty state.

Scope limits to keep it small: one product at a time, no soft-delete, no audit
trail, no bulk delete, no restore/undo. Stay consistent with the existing product
CRUD, keep all new UI text translatable (multilingual), and cover it with backend
tests (happy path, 404 not found, conflict when in stock) and frontend tests
(dialog open/confirm/cancel, success and error notifications, empty state).
```

> Demo tip: have at least one **zero-stock** product (deletable) and one product
> **with stock** (delete blocked) so you can show the business rule live — first
> the conflict error, then the successful delete.

## Demo timeline (~30 min)

1. `/speckit-specify` + the prompt → **spec.md** (~3 min, show spec generation)
2. `/speckit-plan` → plan + design artifacts (~4 min)
3. `/speckit-tasks` → ordered tasks.md (~2 min)
4. `/speckit-implement` → subagents code backend + frontend + tests (~12–15 min)
5. `.\start.ps1` and show the result live (~5 min)

> Tip: deletion makes the "rules/skills respected" magic very visible (DTO,
> `ProblemDetail` 404, accessible dialog, Vitest, i18n) without risking scope
> creep.

---

## Run the app / Lancer l'application

Windows (PowerShell) :
```powershell
.\start.ps1
```

macOS / Linux :
```bash
./start.sh
```

- Backend → http://localhost:8080
- Frontend → http://localhost:4200
- Press Ctrl+C in the launching window to stop both. /
  Ctrl+C dans la fenêtre de lancement pour tout arrêter.
