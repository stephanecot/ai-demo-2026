"""Markdown → HTML for a story readiness report; Chrome then prints it to PDF.

Usage: uv run --with markdown-it-py python <this file> US-009
Reads  docs/revues/<story>-revue.md
Writes docs/revues/<story>-revue.html
"""

import sys
from pathlib import Path

from markdown_it import MarkdownIt

SKILL = Path(".claude/skills/story-readiness/template")


def main() -> None:
    story = sys.argv[1]
    source = Path(f"docs/revues/{story}-revue.md")
    if not source.exists():
        raise SystemExit(f"Rapport introuvable : {source}")

    # CommonMark, not python-markdown: the latter mangles quoted criteria and fenced blocks.
    md = MarkdownIt("commonmark", {"html": True}).enable("table")
    body = md.render(source.read_text(encoding="utf-8"))
    css = (SKILL / "print.css").read_text(encoding="utf-8")

    Path(f"docs/revues/{story}-revue.html").write_text(
        f"<!doctype html><html lang='fr'><head><meta charset='utf-8'>"
        f"<title>Revue {story}</title><style>{css}</style></head><body>{body}</body></html>",
        encoding="utf-8",
    )
    print(f"HTML généré pour {story}")


if __name__ == "__main__":
    main()
