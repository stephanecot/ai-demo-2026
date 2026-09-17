---
name: verify
description: Definition of done for demo4 — runs backend tests, frontend typecheck/lint/tests and OpenSpec validation with the real commands, then reports a PASS/FAIL board. Use before declaring a task or a change finished, after /opsx:apply, or when the user asks "is it green?", "vérifie", "lance les tests".
---

# /verify — definition of done

"Une feature sans test n'est pas terminée ; lance les vraies commandes et rapporte la vraie sortie."
This skill is that rule made executable. Never say a task is done without running it.

## Run

```bash
.claude/skills/verify/scripts/verify.sh --change <change-name>
```

- `--change <name>`: the OpenSpec change being worked on (infer it from the conversation or
  `openspec list`; omit it to validate all changes instead).
- `--skip-backend` / `--skip-frontend`: only when the change clearly touches one side. Default
  to running everything — that is the point.

The script exports `JAVA_HOME` to JDK 25 itself (Spring Boot 4.0.6 rejects the machine's JDK 26).
It takes ~1–2 min because of `./mvnw test`; use a Bash timeout of at least 300000 ms.

## Report

Copy the `=== VERIFY SUMMARY ===` block verbatim into your answer, then:

- **All PASS** → say so in one line, mention how many OpenSpec tasks remain open.
- **Any FAIL** → quote the failing lines the script printed, fix the cause, and re-run `/verify`
  until green. Do not paraphrase errors, do not skip a failing block, do not mark tasks `[x]`
  in `tasks.md` while something fails.
- Never edit tests to make them pass unless the spec scenario itself changed.

When the run is green and every task in `tasks.md` is ticked, suggest `/opsx:archive`.
