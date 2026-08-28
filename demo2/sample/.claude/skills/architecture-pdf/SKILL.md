---
name: architecture-pdf
description: Use to produce a PDF of the project architecture — assembles the design notes, the ADRs and what the code actually contains into one document, then renders it. Ask for it when someone needs an architecture file to read, review or hand over.
---

# Architecture PDF

Produces `docs/architecture.pdf`: one readable document describing what this project is,
how it is built, and which decisions shaped it. Everything in it is **read from the
repository**, never invented — a document that drifts from the code is worse than none.

## Sources, in this order

| Section | Read from |
|---|---|
| Context, stack, conventions | `AGENT.md` |
| Structure and contracts | `docs/architecture/*.md` |
| Decisions | `docs/adr/*.md` — title, status, decision, consequences |
| Endpoints actually exposed | `backend/app/routers/*.py`, or `/openapi.json` if the server runs |
| Data model as built | `backend/app/models/*.py` |
| Screens and routes | `frontend/src/pages/`, `frontend/src/App.tsx` |
| Test and coverage state | `uv run pytest`, `npm run test:coverage` |

When a design note describes something the code does not have yet, say so explicitly —
mark it *planned* rather than presenting it as existing.

## The template

**Start from `template/architecture.md`, next to this file.** Copy it to `docs/architecture.md` and fill
every `{{PLACEHOLDER}}` from the repository. Its HTML comments say where each section's
content comes from; remove them once the section is written.

```bash
cp .claude/skills/architecture-pdf/template/architecture.md docs/architecture.md
```

The template fixes nine sections:

1. **Le projet en une page** — what the application does, for whom, the roles.
2. **Stack et structure** — versions actually installed, the folder tree.
3. **Vue d'ensemble** — deployables, proxy, database, how identity travels.
4. **Modèle de domaine** — entities, invariants and where each is enforced.
5. **Contrat d'API** — one row per real route: verb, status, role required.
6. **Frontend** — layering, screens in place, UI conventions.
7. **Décisions (ADR)** — one row per ADR, statuses reproduced as written.
8. **Qualité** — test and coverage figures from an actual run, plus the guardrails.
9. **Ce qui reste à construire** — the stories not yet implemented.

**Never add or drop a section.** The document is meant to be compared across versions: a
section that is not applicable says so in one line and explains why. Write it in French —
it is a deliverable someone reads, not code.

## Rendering

WeasyPrint needs system libraries (`libgobject`) that are often missing on macOS, and
pandoc is usually not installed either. Chrome headless is the reliable path:

```bash
# 1. Markdown → HTML, with a CommonMark-compliant renderer
uv run --with markdown-it-py python - <<'PY'
from markdown_it import MarkdownIt
from pathlib import Path
md = MarkdownIt("commonmark", {"html": True}).enable("table")
body = md.render(Path("docs/architecture.md").read_text())
css = Path(".claude/skills/architecture-pdf/template/print.css").read_text()
Path("docs/architecture.html").write_text(
    f"<!doctype html><html lang='fr'><head><meta charset='utf-8'>"
    f"<title>Architecture</title><style>{css}</style></head><body>{body}</body></html>")
PY

# 2. HTML → PDF
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/architecture.pdf" "file://$PWD/docs/architecture.html"
```

Use a CommonMark renderer, not `python-markdown`: the latter fails to parse fenced code
blocks nested inside blockquotes or list items, which silently turns code into prose and
`#` comments into headings.

The print stylesheet ships with this skill (`template/print.css`): A4 with 16/14 mm margins,
`print-color-adjust: exact` so table headers keep their background, `break-inside: avoid`
on `pre` and on table rows, and `white-space: pre-wrap` so no line is cut off the page.
Reuse it rather than re-inventing one — a document that looks different every month reads
as an unreliable document.

## Verify before handing it over

Never ship a PDF you have not looked at:

```bash
# page count
python3 -c "import re;d=open('docs/architecture.pdf','rb').read();print(len(re.findall(rb'/Type\s*/Page[^s]',d)),'pages')"

# visual check
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --screenshot="/tmp/arch.png" --window-size=1240,1700 "file://$PWD/docs/architecture.html"
```

Open the screenshot and confirm the code blocks are rendered as blocks, the tables have
their header row, and no heading appears where a comment should be.

## Checklist

- [ ] Built from `template/architecture.md`: nine sections, none added, none dropped.
- [ ] No `{{PLACEHOLDER}}` and no guidance comment left in the output.
- [ ] Every claim traced to a file in the repository, not to memory.
- [ ] Anything designed but not yet built is marked *planned*.
- [ ] Endpoint and model tables match the code, checked against `/openapi.json` when possible.
- [ ] ADR statuses reproduced as written, superseded ones included.
- [ ] Test and coverage figures come from an actual run, and are dated.
- [ ] PDF rendered with Chrome, page count reported, rendering checked on a screenshot.
- [ ] Document written in French; code identifiers left in English.
