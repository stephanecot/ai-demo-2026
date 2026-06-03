# Token usage report

_Generated: 2026-06-03T21:21:49.708Z · Events: 14_

## Summary by main agent, subagents & skills

| Type | Name | Model | Runs | Input | Cache write | Output | Total | Avg total/run |
|------|------|-------|-----:|------:|------------:|-------:|------:|--------------:|
| main | `main:45908cd5` | claude-opus-4-8 | 1 | 160,596 | 3,875,915 | 1,040,078 | 5,076,589 | 5,076,589 |
| agent | `angular-dev` | claude-sonnet-4-6 | 4 | 732 | 854,136 | 105,674 | 960,542 | 240,136 |
| main | `main:7b99c08b` | claude-opus-4-8 | 1 | 54,267 | 595,264 | 101,685 | 751,216 | 751,216 |
| agent | `spring-boot-dev` | claude-sonnet-4-6 | 2 | 272 | 370,125 | 41,639 | 412,036 | 206,018 |
| agent | `main` | claude-haiku-4-5-20251001 | 3 | 46 | 48,178 | 686 | 48,910 | 16,303 |
| skill | `backend-documentation` | — | 1 | — | — | — | — | — |
| skill | `angular-a11y-responsive` | — | 1 | — | — | — | — | — |
| skill | `frontend-documentation` | — | 1 | — | — | — | — | — |
| **All** | | | 14 | **215,913** | **5,743,618** | **1,289,762** | **7,249,293** | |

### By kind

| Kind | Runs | Input | Cache write | Output | Total |
|------|-----:|------:|------------:|-------:|------:|
| main | 2 | 214,863 | 4,471,179 | 1,141,763 | 5,827,805 |
| agent | 9 | 1,050 | 1,272,439 | 147,999 | 1,421,488 |
| skill | 3 | — | — | — | — |

## By speckit feature

| Feature | Events | Input | Cache write | Output | Total |
|---------|-------:|------:|------------:|-------:|------:|
| `001-product-management` | 14 | 215,913 | 5,743,618 | 1,289,762 | 7,249,293 |

> **main** = main agent (whole session, cumulative, exact, upserted). **agent**
> = subagent (own transcript, exact, per run; custom agents keep their name,
> Claude-managed ones → `main`). **skill** = inline invocation — **count only** (`—`).
>
> **Model** from the transcript · **Input** = new uncached · **Cache write** =
> cache_creation (inflates on long agents via cache refresh) · **Output** =
> generated · **Total** = the three summed. Cache *reads* excluded. For "real
> work", read Input + Output.

## Events (most recent last)

| Time (UTC) | Feature | Type | Name | Model | Input | Cache write | Output | Total |
|------------|---------|------|------|-------|------:|------------:|-------:|------:|
| 2026-06-03 21:11:52 | `001-product-management` | agent | `main` | claude-haiku-4-5-20251001 | 16 | 26625 | 34 | 26675 |
| 2026-06-03 21:11:52 | `001-product-management` | agent | `main` | claude-haiku-4-5-20251001 | 19 | 12614 | 381 | 13014 |
| 2026-06-03 21:11:52 | `001-product-management` | agent | `main` | claude-haiku-4-5-20251001 | 11 | 8939 | 271 | 9221 |
| 2026-06-03 21:11:52 | `001-product-management` | agent | `spring-boot-dev` | claude-sonnet-4-6 | 235 | 300510 | 36402 | 337147 |
| 2026-06-03 21:11:52 | `001-product-management` | agent | `angular-dev` | claude-sonnet-4-6 | 278 | 215233 | 49910 | 265421 |
| 2026-06-03 21:11:52 | `001-product-management` | agent | `angular-dev` | claude-sonnet-4-6 | 178 | 251835 | 19704 | 271717 |
| 2026-06-03 21:11:52 | `001-product-management` | agent | `angular-dev` | claude-sonnet-4-6 | 118 | 66117 | 10647 | 76882 |
| 2026-06-03 21:12:20 | `001-product-management` | skill | `backend-documentation` | — | — | — | — | — |
| 2026-06-03 21:12:27 | `001-product-management` | skill | `angular-a11y-responsive` | — | — | — | — | — |
| 2026-06-03 21:12:29 | `001-product-management` | skill | `frontend-documentation` | — | — | — | — | — |
| 2026-06-03 21:14:22 | `001-product-management` | agent | `spring-boot-dev` | claude-sonnet-4-6 | 37 | 69615 | 5237 | 74889 |
| 2026-06-03 21:20:50 | `001-product-management` | agent | `angular-dev` | claude-sonnet-4-6 | 158 | 320951 | 25413 | 346522 |
| 2026-06-03 21:21:45 | `001-product-management` | main | `main:7b99c08b` | claude-opus-4-8 | 54267 | 595264 | 101685 | 751216 |
| 2026-06-03 21:21:49 | `001-product-management` | main | `main:45908cd5` | claude-opus-4-8 | 160596 | 3875915 | 1040078 | 5076589 |

<!-- diag · last event: stop · payload keys: session_id, transcript_path, cwd, permission_mode, effort, hook_event_name, stop_hook_active, last_assistant_message, background_tasks, session_crons -->
