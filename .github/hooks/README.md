# GitHub Copilot hooks — token tracking

Copilot-format duplicate of the Claude Code token-tracking hooks
(`.claude/hooks/` + `.claude/settings.json`).

## Files

- `token-tracking.json` — Copilot CLI hook config (`.github/hooks/*.json` is
  auto-loaded from the repo root; personal hooks go in `~/.copilot/hooks/`).
- `token-tracker.mjs` — the tracker script (field-name tolerant: accepts both
  Claude `snake_case` and Copilot `camelCase` payloads).

## Mapping (Claude Code → Copilot)

| Concept | Claude Code | GitHub Copilot |
|---------|-------------|----------------|
| Agents | `.claude/agents/*.md` | `.github/agents/*.agent.md` (custom agents) |
| Hooks  | `.claude/settings.json` `hooks` | `.github/hooks/*.json` (`version: 1`) |
| Main agent event | `Stop` | `agentStop` / `Stop` |
| Subagent event | `SubagentStop` | `subagentStop` |
| Skills | `.claude/skills/**` | reused as-is (backward compatible) |

## What is tracked

- **main** (on `Stop`/`agentStop`): the main agent's whole-session token totals
  (cumulative, exact), one upserted row per session.
- **agent** (on `subagentStop`): each subagent run, summed from its own transcript.
  Custom agents (in `.claude/agents` / `.github/agents`) keep their name; any other
  Claude/Copilot-managed agent is bucketed as `main`.
- **skill** (recomputed on every `Stop`): **count only**. Rather than a fragile
  per-event hook, the tracker scans the main transcript **and all subagent
  transcripts** for `Skill` tool-use entries — so EVERY invocation is counted
  (including skills used inside subagents) and the count is fully rebuildable.

## Output

Writes a single **markdown** file (no JSON) to `reports/`, kept separate from the
Claude run so both can coexist: `token-usage-copilot.md`. The file is its own
datastore — the script parses its "Events" table, appends the new event, and
recomputes the summary on each run.

## Caveats

- **Agent totals** are exact only when the surface exposes a per-agent
  transcript with usage. Copilot may not provide a transcript path on
  `subagentStop`; in that case token columns are `0` but run counts are recorded.
- Skill counting reads `tool_use` entries named `Skill` from the transcripts; if
  Copilot records skill invocations under a different tool name, adjust the
  `name === 'Skill'` check in `skillInvocations()`.
- Hooks run from the repo root, so `reports/` lands at the project root.
