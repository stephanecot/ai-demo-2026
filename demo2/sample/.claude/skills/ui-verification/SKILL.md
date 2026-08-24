---
name: ui-verification
description: Use to verify the CRA app in a real browser with the Chrome DevTools MCP server — check a screen actually renders, drive the demo scenario end to end, catch console errors and failed network calls, take screenshots. Complements Vitest, which stays the tool for component tests.
---

# UI verification with Chrome DevTools MCP

Vitest tests components in jsdom. This skill checks the **running application** in a real
Chrome: the proxy, the `X-Demo-User` header, the real payloads, the CSS, the console.
Both are needed — a green Vitest suite proves nothing about a broken dev proxy.

## Prerequisites

The MCP server is configured (phase 0 of `PLAN.MD`) and both sides are running:

```bash
cd backend && uv run uvicorn app.main:app --reload    # :8000
cd frontend && npm run dev                             # :5173
```

Always drive `http://localhost:5173` (the Vite proxy), never `:8000` directly — testing
the proxy path is half the point.

## Loop

1. `navigate_page` to the screen under test.
2. `take_snapshot` — the accessibility tree. **Read it before acting**: it gives the `uid`
   of each element and shows what the user actually perceives. Never click blind.
3. Act: `click`, `fill`, `fill_form`, `hover`, `handle_dialog`.
4. `wait_for` on the text that proves the result, rather than a fixed delay.
5. `list_console_messages` — any error or warning is a finding, even if the screen looks fine.
6. `list_network_requests` — every `/api/...` call must be 2xx, or a deliberate 4xx whose
   French message is displayed on screen.
7. `take_screenshot` for the report or when something looks wrong.

## What to check on every screen

- The three states really happen: loading, error, empty. Force the error state by stopping
  the backend or by using `emulate_network` to throttle, then reload.
- Labels are in French; no raw enum (`SUBMITTED`), no ISO date (`2026-03-02`).
- Role-dependent UI matches the story: a consultant sees no "Valider" button.
- Keyboard path works: Tab reaches every control, Enter activates, Escape closes a modal.
- `resize_page` to 375 px — nothing overflows horizontally.
- The backend error message is the one displayed, not a generic sentence.

## Authorisation is checked at the API, not here

Hiding a button proves nothing. When a story restricts an action by role, verify with a
direct call — the UI check is a complement:

```bash
curl -s -o /dev/null -w '%{http_code}' -X POST localhost:8000/api/missions \
  -H 'X-Demo-User: 1' -H 'Content-Type: application/json' \
  -d '{"name":"X","client":"Y","startDate":"2026-01-05"}'   # expect 403 for a consultant
```

## Demo scenario (phase 5)

Run it as one uninterrupted sequence, screenshotting each step:

1. Log in as **Jean** (consultant) → dashboard shows the current month as `Brouillon`.
2. Open the monthly CRA → fill several days, one in half-days across two missions.
3. Check the running total updates, and that a full day refuses a further entry.
4. Submit → status becomes `Soumis`, the calendar turns read-only.
5. Switch to **Paul** (manager) → the CRA appears in the pending list.
6. Reject it with a comment → Jean is notified, the CRA returns to `Brouillon`.
7. As Jean, correct and resubmit; as Paul, approve.
8. Export the PDF and confirm the file downloads without the "PROVISOIRE" watermark.

At each step: snapshot, assert the visible French label, check the console stays clean.

## Reporting a UI finding

State what was done, what was expected, what happened, and the evidence:

```
Écran : validation manager (US-006)
Action : clic sur « Refuser » sans saisir de commentaire
Attendu : message « Commentaire obligatoire », aucun appel API
Observé : POST /api/cra/7/refuser → 422, aucun message affiché
Preuve : console propre, requête réseau ci-dessus, capture jointe
```

## Guardrails

- Never fix a bug from inside this skill — report it to `react-dev` or `fastapi-dev`.
- A clean screen with console errors is a failure, not a pass.
- Do not treat a screenshot as proof of behaviour; the snapshot and the network log are
  the evidence, the screenshot is the illustration.
- Do not use the browser to replace component tests: a rule that can be tested in Vitest
  or pytest belongs there, where it runs in a second.

## Checklist

- [ ] Both servers running; driven through `localhost:5173`.
- [ ] Snapshot read before each interaction.
- [ ] Console messages checked and clean.
- [ ] All `/api/...` calls 2xx, or an intended 4xx displayed in French.
- [ ] Loading, error and empty states observed, not assumed.
- [ ] Role restriction confirmed at the API, not only in the UI.
- [ ] Screenshots attached for the steps that matter.
