---
name: mvn-wrapper
allowed-tools: Bash, Read, Glob, Grep
description: >-
  The canonical Maven command reference for the Spring Boot 4 backend in this
  repo — always via the Maven Wrapper (./mvnw): run, test, package, single-test,
  dependency and profile usage. Use whenever you need to run a backend build/test
  task so the right command is used consistently. Run from the backend directory.
model: haiku
---

# mvn wrapper (backend commands)

Single source of truth for driving the Spring Boot backend with Maven. **Always
use the Maven Wrapper `./mvnw`** (committed in the repo) — never a system-wide
`mvn` — so everyone builds with the same Maven version. Run these **from the
backend project directory** (where `pom.xml` and `mvnw` live, e.g. `backend/`).

## Everyday commands

| Task | Command |
|------|---------|
| Run the app | `./mvnw spring-boot:run` |
| Run the app on a profile | `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` |
| Run all tests | `./mvnw test` |
| Run one test class | `./mvnw test -Dtest=ProductServiceTest` |
| Run one test method | `./mvnw test -Dtest=ProductServiceTest#decrementsStockOnSale` |
| Run integration tests | `./mvnw verify` |
| Package (jar) | `./mvnw clean package` |
| Skip tests when packaging | `./mvnw clean package -DskipTests` |
| Dependency tree | `./mvnw dependency:tree` |
| Clean build outputs | `./mvnw clean` |

> On Windows use `mvnw.cmd`. On macOS/Linux ensure `./mvnw` is executable
> (`chmod +x mvnw`).

## Rules

- **`./mvnw`, not `mvn`.** If the wrapper is missing, generate it once with
  `mvn -N wrapper:wrapper` and commit `mvnw`, `mvnw.cmd`, `.mvn/`.
- After changing code, run `./mvnw test` (or `verify` for integration) and
  **report the real output**. Don't mark work done on a red suite.
- Use `-Dtest=...` to iterate fast on a single test; run the full suite before
  declaring done.
- `-DskipTests` (skip running) / `-Dmaven.test.skip=true` (skip compiling+running)
  are for packaging only — never to "make the build pass".
- Activate environment behavior with Spring **profiles**, not by editing code.
- Don't commit `target/`. Don't hand-edit the wrapper files in `.mvn/`.
- Keep the build reproducible: pin the Spring Boot parent/BOM version in `pom.xml`;
  don't rely on version ranges.

## Quick checklist before "done"

- [ ] `./mvnw clean test` green (or `verify` if integration tests exist)
- [ ] No skipped tests hiding failures
- [ ] App still starts: `./mvnw spring-boot:run` (smoke check for risky changes)
