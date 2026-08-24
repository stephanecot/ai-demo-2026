# Token usage report

_Generated: 2026-06-05T11:20:23.058Z · Events: 27_

## Summary by main agent, subagents & skills

| Type | Name | Model | Runs | Input | Cache write | Output | Total | Avg total/run |
|------|------|-------|-----:|------:|------------:|-------:|------:|--------------:|
| main | `main:45908cd5` | claude-opus-4-8 | 1 | 165,469 | 3,966,333 | 1,122,828 | 5,254,630 | 5,254,630 |
| agent | `angular-dev` | claude-sonnet-4-6 | 5 | 835 | 1,048,513 | 129,530 | 1,178,878 | 235,776 |
| main | `main:7b99c08b` | claude-opus-4-8 | 1 | 54,267 | 595,264 | 101,685 | 751,216 | 751,216 |
| agent | `spring-boot-dev` | claude-sonnet-4-6 | 2 | 272 | 370,125 | 41,639 | 412,036 | 206,018 |
| main | `main:aa542b90` | claude-opus-4-8 | 1 | 14,088 | 265,709 | 103,859 | 383,656 | 383,656 |
| agent | `main` | claude-haiku-4-5-20251001 | 17 | 16,532 | 209,189 | 6,011 | 231,732 | 13,631 |
| **All** | | | 27 | **251,463** | **6,455,133** | **1,505,552** | **8,212,148** | |

### By kind

| Kind | Runs | Input | Cache write | Output | Total |
|------|-----:|------:|------------:|-------:|------:|
| main | 3 | 233,824 | 4,827,306 | 1,328,372 | 6,389,502 |
| agent | 24 | 17,639 | 1,627,827 | 177,180 | 1,822,646 |

## By speckit feature

| Feature | Events | Input | Cache write | Output | Total |
|---------|-------:|------:|------------:|-------:|------:|
| `001-product-management` | 27 | 251,463 | 6,455,133 | 1,505,552 | 8,212,148 |

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
| 2026-06-03 21:14:22 | `001-product-management` | agent | `spring-boot-dev` | claude-sonnet-4-6 | 37 | 69615 | 5237 | 74889 |
| 2026-06-03 21:20:50 | `001-product-management` | agent | `angular-dev` | claude-sonnet-4-6 | 158 | 320951 | 25413 | 346522 |
| 2026-06-03 21:21:45 | `001-product-management` | main | `main:7b99c08b` | claude-opus-4-8 | 54267 | 595264 | 101685 | 751216 |
| 2026-06-03 21:24:48 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-03 21:35:38 | `001-product-management` | agent | `angular-dev` | claude-sonnet-4-6 | 103 | 194377 | 23856 | 218336 |
| 2026-06-03 21:37:09 | `001-product-management` | main | `main:45908cd5` | claude-opus-4-8 | 165469 | 3966333 | 1122828 | 5254630 |
| 2026-06-04 12:30:27 | `001-product-management` | agent | `main` | claude-haiku-4-5-20251001 | 16486 | 161011 | 5325 | 182822 |
| 2026-06-04 12:35:42 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 10:48:51 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 10:49:49 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 10:51:20 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 10:51:48 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 10:55:15 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 10:55:59 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 11:02:43 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 11:03:33 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 11:07:59 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 11:14:13 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |
| 2026-06-05 11:17:17 | `001-product-management` | main | `main:aa542b90` | claude-opus-4-8 | 14088 | 265709 | 103859 | 383656 |
| 2026-06-05 11:20:23 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |

<!-- diag · last event: subagentstop · payload keys: session_id, transcript_path, cwd, permission_mode, agent_id, agent_type, effort, hook_event_name, stop_hook_active, agent_transcript_path, last_assistant_message, background_tasks, session_crons -->
