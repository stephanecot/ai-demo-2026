# Token usage report

_Generated: 2026-06-03T21:44:03.070Z · Events: 43_

## Summary by main agent, subagents & skills

| Type | Name | Model | Runs | Input | Cache write | Output | Total | Avg total/run |
|------|------|-------|-----:|------:|------------:|-------:|------:|--------------:|
| main | `main:45908cd5` | claude-opus-4-8 | 1 | 165,469 | 3,966,333 | 1,122,828 | 5,254,630 | 5,254,630 |
| agent | `angular-dev` | claude-sonnet-4-6 | 5 | 835 | 1,048,513 | 129,530 | 1,178,878 | 235,776 |
| main | `main:7b99c08b` | claude-opus-4-8 | 1 | 54,267 | 595,264 | 101,685 | 751,216 | 751,216 |
| agent | `spring-boot-dev` | claude-sonnet-4-6 | 2 | 272 | 370,125 | 41,639 | 412,036 | 206,018 |
| agent | `main` | claude-haiku-4-5-20251001 | 5 | 46 | 48,178 | 686 | 48,910 | 9,782 |
| skill | `update-config` | — | 1 | — | — | — | — | — |
| skill | `speckit-git-initialize` | — | 1 | — | — | — | — | — |
| skill | `speckit-git-feature` | — | 1 | — | — | — | — | — |
| skill | `npm-wrapper` | — | 4 | — | — | — | — | — |
| skill | `angular-best-practices` | — | 2 | — | — | — | — | — |
| skill | `angular-design-system` | — | 3 | — | — | — | — | — |
| skill | `tailwindcss` | — | 2 | — | — | — | — | — |
| skill | `angular-i18n-transloco` | — | 2 | — | — | — | — | — |
| skill | `angular-testing` | — | 3 | — | — | — | — | — |
| skill | `backend-documentation` | — | 1 | — | — | — | — | — |
| skill | `angular-a11y-responsive` | — | 1 | — | — | — | — | — |
| skill | `frontend-documentation` | — | 1 | — | — | — | — | — |
| skill | `frontend-design` | — | 1 | — | — | — | — | — |
| skill | `spring-boot-best-practices` | — | 1 | — | — | — | — | — |
| skill | `spring-boot-mongodb` | — | 1 | — | — | — | — | — |
| skill | `spring-boot-rest-api` | — | 1 | — | — | — | — | — |
| skill | `spring-boot-service-layer` | — | 1 | — | — | — | — | — |
| skill | `spring-boot-testing` | — | 1 | — | — | — | — | — |
| skill | `mvn-wrapper` | — | 1 | — | — | — | — | — |
| **All** | | | 43 | **220,889** | **6,028,413** | **1,396,368** | **7,645,670** | |

### By kind

| Kind | Runs | Input | Cache write | Output | Total |
|------|-----:|------:|------------:|-------:|------:|
| main | 2 | 219,736 | 4,561,597 | 1,224,513 | 6,005,846 |
| agent | 12 | 1,153 | 1,466,816 | 171,855 | 1,639,824 |
| skill | 29 | — | — | — | — |

## By speckit feature

| Feature | Events | Input | Cache write | Output | Total |
|---------|-------:|------:|------------:|-------:|------:|
| `001-product-management` | 43 | 220,889 | 6,028,413 | 1,396,368 | 7,645,670 |

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
| 2026-06-03 19:21:08 | `001-product-management` | skill | `update-config` | — | — | — | — | — |
| 2026-06-03 19:32:32 | `001-product-management` | skill | `speckit-git-initialize` | — | — | — | — | — |
| 2026-06-03 19:46:02 | `001-product-management` | skill | `speckit-git-feature` | — | — | — | — | — |
| 2026-06-03 20:11:28 | `001-product-management` | skill | `npm-wrapper` | — | — | — | — | — |
| 2026-06-03 20:31:31 | `001-product-management` | skill | `angular-best-practices` | — | — | — | — | — |
| 2026-06-03 20:31:33 | `001-product-management` | skill | `npm-wrapper` | — | — | — | — | — |
| 2026-06-03 20:31:35 | `001-product-management` | skill | `angular-design-system` | — | — | — | — | — |
| 2026-06-03 20:31:37 | `001-product-management` | skill | `tailwindcss` | — | — | — | — | — |
| 2026-06-03 20:31:40 | `001-product-management` | skill | `angular-i18n-transloco` | — | — | — | — | — |
| 2026-06-03 20:31:42 | `001-product-management` | skill | `angular-testing` | — | — | — | — | — |
| 2026-06-03 21:12:20 | `001-product-management` | skill | `backend-documentation` | — | — | — | — | — |
| 2026-06-03 21:12:27 | `001-product-management` | skill | `angular-a11y-responsive` | — | — | — | — | — |
| 2026-06-03 21:12:29 | `001-product-management` | skill | `frontend-documentation` | — | — | — | — | — |
| 2026-06-03 20:50:53 | `001-product-management` | skill | `angular-best-practices` | — | — | — | — | — |
| 2026-06-03 20:50:56 | `001-product-management` | skill | `angular-design-system` | — | — | — | — | — |
| 2026-06-03 20:50:58 | `001-product-management` | skill | `tailwindcss` | — | — | — | — | — |
| 2026-06-03 20:51:00 | `001-product-management` | skill | `angular-i18n-transloco` | — | — | — | — | — |
| 2026-06-03 20:51:02 | `001-product-management` | skill | `angular-testing` | — | — | — | — | — |
| 2026-06-03 20:51:05 | `001-product-management` | skill | `npm-wrapper` | — | — | — | — | — |
| 2026-06-03 20:59:36 | `001-product-management` | skill | `angular-testing` | — | — | — | — | — |
| 2026-06-03 21:27:30 | `001-product-management` | skill | `frontend-design` | — | — | — | — | — |
| 2026-06-03 21:27:32 | `001-product-management` | skill | `angular-design-system` | — | — | — | — | — |
| 2026-06-03 21:34:25 | `001-product-management` | skill | `npm-wrapper` | — | — | — | — | — |
| 2026-06-03 20:31:12 | `001-product-management` | skill | `spring-boot-best-practices` | — | — | — | — | — |
| 2026-06-03 20:31:14 | `001-product-management` | skill | `spring-boot-mongodb` | — | — | — | — | — |
| 2026-06-03 20:31:17 | `001-product-management` | skill | `spring-boot-rest-api` | — | — | — | — | — |
| 2026-06-03 20:31:20 | `001-product-management` | skill | `spring-boot-service-layer` | — | — | — | — | — |
| 2026-06-03 20:31:20 | `001-product-management` | skill | `spring-boot-testing` | — | — | — | — | — |
| 2026-06-03 20:31:24 | `001-product-management` | skill | `mvn-wrapper` | — | — | — | — | — |
| 2026-06-03 21:44:03 | `001-product-management` | agent | `main` | — | 0 | 0 | 0 | 0 |

<!-- diag · last event: subagentstop · payload keys: session_id, transcript_path, cwd, permission_mode, agent_id, agent_type, effort, hook_event_name, stop_hook_active, agent_transcript_path, last_assistant_message, background_tasks, session_crons -->
