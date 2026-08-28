# Specification Quality Checklist: Mission Management

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-28
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

**Iteration 1 (2026-08-28)** — all 16 items pass. No clarification markers were needed: every
gap in the source story had a defensible default, and each is recorded in **Assumptions**
rather than left implicit.

Judgement calls worth a reviewer's attention, since a different answer would change the work:

- **Closure semantics.** *"n'apparaît plus pour les saisies futures"* is read as "no longer
  offered for any new declaration", not "blocked only for future dates". A closed mission
  therefore accepts no new declaration at all. The alternative reading would make closure
  equivalent to setting an end date, which would make the status filter in criterion 5
  redundant.
- **Detachment (FR-009) is an addition.** The source story only says *"peut affecter"*. It is
  included because *"gérer les missions (… consultants affectés)"* covers the assignment
  lifecycle, and because a demo that can attach but never detach reads as broken. Cut it if
  you want to stay literal to the criteria.
- **Consultants read but do not browse** (FR-025). The source story does not say who the
  filterable list is for; it is scoped to managers, with consultants seeing only their own
  assigned missions.
- The source story's *Notes techniques* (endpoint paths, manager-only access) were
  deliberately left out: they are implementation detail belonging to `/speckit-plan`. The
  underlying rule they encode is kept as FR-022 and FR-023.

No items require spec updates before `/speckit-clarify` or `/speckit-plan`.
