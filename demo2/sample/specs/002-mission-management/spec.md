# Feature Specification: Mission Management

**Feature Branch**: `main`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "J'ai corrigé l'US2. refait la spec"

**Source story**: `demo2/specs/US-002-gestion-missions.md` — *En tant que manager, je veux créer et gérer les missions (client, période, consultants affectés), afin que les consultants puissent imputer leur activité sur les bonnes missions.*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and maintain the mission catalogue (Priority: P1)

A manager records a new client engagement: its name, the client it is for, when it starts,
optionally when it ends, and a description of what it covers. They can come back later and
correct any of it as the engagement evolves.

**Why this priority**: Nothing else in this feature — or in monthly timesheet entry — exists
until missions do. A catalogue of missions is already useful on its own: it tells the company
what engagements are running for which clients.

**Independent Test**: As a manager, create a mission for a client with a start date and no end
date, reopen it, change its description and end date, and confirm both the creation and the
correction are visible afterwards.

**Acceptance Scenarios**:

1. **Given** a manager, **When** they create a mission with a name, a client, a start date and a description, **Then** the mission is recorded and appears in the mission list.
2. **Given** a manager creating a mission, **When** they leave the end date empty, **Then** the mission is accepted and treated as running indefinitely.
3. **Given** an existing mission, **When** the manager changes its name, client, dates or description, **Then** the change is recorded and reflected everywhere the mission appears.
4. **Given** a client that already has a mission named "Refonte SI", **When** a manager creates another mission named "Refonte SI" for that same client, **Then** the creation is refused with a French message explaining the name is already used for this client.
5. **Given** a client that already has a mission named "Refonte SI", **When** a manager creates a mission with that same name for a *different* client, **Then** the creation is accepted.
6. **Given** a manager creating or editing a mission, **When** the end date precedes the start date, **Then** the change is refused with a French explanation.
7. **Given** a manager creating a mission, **When** the name or the client is empty or blank, **Then** the creation is refused.

---

### User Story 2 - Assign consultants to a mission (Priority: P2)

A manager decides who works on an engagement by attaching one or several consultants to it,
and detaches a consultant who moves off the engagement. This is what makes the mission
declarable by those consultants and by no one else.

**Why this priority**: This is the link that turns a catalogue entry into something a
consultant can charge time against — the stated purpose of the story. It comes after creation
because it has nothing to attach to before then.

**Independent Test**: Assign two consultants to a mission, confirm both appear as assigned,
detach one, and confirm only the remaining one is still assigned.

**Acceptance Scenarios**:

1. **Given** an existing mission, **When** a manager assigns a consultant to it, **Then** that consultant is listed among the mission's assignees.
2. **Given** an existing mission, **When** a manager assigns several consultants in one action, **Then** all of them are listed among the assignees.
3. **Given** a consultant already assigned to a mission, **When** a manager assigns them again, **Then** no duplicate assignment is created and the operation does not fail with an unexplained error.
4. **Given** an assigned consultant, **When** a manager detaches them from the mission, **Then** they no longer appear as assigned and can no longer declare new activity on it.
5. **Given** a consultant who has already declared days on a mission, **When** a manager detaches them, **Then** the declarations already recorded are preserved untouched.
6. **Given** a manager assigning someone, **When** the person named is not a consultant, or does not exist, **Then** the assignment is refused with a French explanation.

---

### User Story 3 - A consultant only sees the missions they may charge (Priority: P2)

When a consultant fills in their timesheet, the missions offered to them are exactly those
they are assigned to and that are running on the date concerned — no closed engagements, no
engagements that have not started, no one else's missions.

**Why this priority**: This is the contract that monthly timesheet entry consumes. It ranks
with assignment because the two together deliver the story's stated goal; separating them lets
the manager-facing and consultant-facing halves be tested apart.

**Independent Test**: For a consultant assigned to one running mission, one not-yet-started
mission and one closed mission, request their declarable missions for a date inside the
running mission's window and confirm exactly one mission comes back.

**Acceptance Scenarios**:

1. **Given** a consultant assigned to three missions, **When** they ask for the missions they may charge on a given date, **Then** only the missions running on that date are returned.
2. **Given** a mission whose start date is after the requested date, **When** the consultant asks for their declarable missions, **Then** that mission is not offered.
3. **Given** a mission whose end date is before the requested date, **When** the consultant asks for their declarable missions, **Then** that mission is not offered.
4. **Given** a mission with no end date that has already started, **When** the consultant asks for their declarable missions, **Then** that mission is offered.
5. **Given** a mission the consultant is not assigned to, **When** they ask for their declarable missions, **Then** that mission is not offered, even if it is running.
6. **Given** a consultant with no assignment at all, **When** they ask for their declarable missions, **Then** an empty result is returned and the interface explains the situation in French rather than showing a blank list.

---

### User Story 4 - Close a mission without losing its history (Priority: P3)

When an engagement ends, a manager closes it. It stops being offered for new declarations,
but everything already declared against it stays exactly as it was, so past months remain
accurate and auditable.

**Why this priority**: A demo month can be run without ever closing a mission, but closure is
what keeps the catalogue usable over time and it is the criterion most likely to be got wrong
by silently rewriting history.

**Independent Test**: Close a mission a consultant has already declared days on; confirm the
mission is no longer offered for new declarations, and confirm the consultant's existing
declarations and monthly totals are unchanged.

**Acceptance Scenarios**:

1. **Given** a running mission, **When** a manager closes it, **Then** its status becomes closed and it stops being offered to consultants for new declarations.
2. **Given** a closed mission on which declarations exist, **When** anyone views those past declarations, **Then** they are unchanged and still show the mission they belong to.
3. **Given** a closed mission, **When** a consultant attempts to declare activity on it anyway, **Then** the attempt is refused with a French explanation.
4. **Given** a closed mission, **When** a manager consults the mission list filtered on closed missions, **Then** it appears there with its status shown in French.
5. **Given** an already closed mission, **When** a manager closes it again, **Then** nothing changes and no error is reported to the user as a failure of their action.

---

### User Story 5 - Find a mission in the catalogue (Priority: P3)

A manager looking after many engagements narrows the list down by client, by whether the
mission is still running or closed, and by the consultant working on it.

**Why this priority**: With a handful of demo missions the list is readable unfiltered; the
filters become necessary as the catalogue grows. Pure convenience, so it comes last.

**Independent Test**: With missions across two clients, some closed, request the list filtered
by one client, then by closed status, then by one consultant, and confirm each result contains
exactly the expected missions.

**Acceptance Scenarios**:

1. **Given** missions for several clients, **When** a manager filters the list by one client, **Then** only that client's missions are listed.
2. **Given** running and closed missions, **When** a manager filters by status, **Then** only the missions in that status are listed.
3. **Given** missions with different assignees, **When** a manager filters by one consultant, **Then** only the missions that consultant is assigned to are listed.
4. **Given** several filters set at once, **When** the list is requested, **Then** only the missions matching every filter are listed.
5. **Given** a filter combination that matches nothing, **When** the list is requested, **Then** an empty result is presented with a French explanation, not an error.
6. **Given** the mission list, **When** it is displayed, **Then** each mission shows at least its name, its client, its period and its status.

---

### Edge Cases

- A mission whose start date is in the future is created successfully but is offered to no one until that date arrives.
- A mission closed on the same day a consultant is declaring: the day is judged against the mission's state at the moment of declaration, and any declaration already accepted stands.
- Two managers create the same mission name for the same client at the same time: only one succeeds; the other gets the duplicate-name refusal, not a crash.
- A mission name differing only by surrounding spaces or by letter case is treated as the same name for the uniqueness rule.
- Deleting is not offered: a mission that should no longer be used is closed, so no declaration is ever left pointing at something that vanished.
- A consultant with no assignment sees an empty but explained mission choice rather than an apparently broken screen.
- Detaching the last consultant from a running mission is allowed; the mission stays in the catalogue with no assignee.
- A very long mission name or description is stored and displayed without breaking the list layout.

## Requirements *(mandatory)*

### Functional Requirements

**Mission catalogue**

- **FR-001**: Managers MUST be able to create a mission carrying a name, a client, a start date, an optional end date and a description.
- **FR-002**: Managers MUST be able to modify an existing mission's name, client, dates and description.
- **FR-003**: The system MUST treat a mission with no end date as running indefinitely from its start date.
- **FR-004**: The system MUST refuse a mission whose name is already used by another mission of the same client, comparing names ignoring case and surrounding whitespace.
- **FR-005**: The system MUST accept the same mission name for two different clients.
- **FR-006**: The system MUST refuse a mission whose end date precedes its start date, and one whose name or client is empty.
- **FR-007**: The system MUST NOT offer deletion of a mission; withdrawing a mission from use is done by closing it.

**Assignments**

- **FR-008**: Managers MUST be able to assign one or several consultants to a mission in a single action.
- **FR-009**: Managers MUST be able to detach a consultant from a mission.
- **FR-010**: The system MUST hold at most one assignment per pair of consultant and mission, and MUST treat a repeated assignment as having no further effect rather than as a failure.
- **FR-011**: The system MUST refuse to assign a person who does not exist or who is not a consultant.
- **FR-012**: The system MUST preserve every declaration already recorded by a consultant on a mission when that consultant is detached from it.

**What a consultant may charge**

- **FR-013**: The system MUST expose, for a given consultant and a given date, the missions that consultant may declare activity on: those they are assigned to, that are not closed, and whose period covers that date.
- **FR-014**: The system MUST exclude from that set any mission that has not started, that has ended, that is closed, or that the consultant is not assigned to.
- **FR-015**: The system MUST refuse a declaration of activity against a mission that is not in that set at the moment of the declaration.

**Closure**

- **FR-016**: Managers MUST be able to close a mission.
- **FR-017**: The system MUST stop offering a closed mission for any new declaration.
- **FR-018**: The system MUST leave every existing declaration, and every monthly total derived from them, unchanged when a mission is closed.
- **FR-019**: The system MUST keep a closed mission visible in the catalogue and in past timesheets, with its status distinguishable from a running mission.

**Browsing**

- **FR-020**: Managers MUST be able to list missions and to narrow that list by client, by status and by assigned consultant, individually or in combination.
- **FR-021**: The list MUST show, for each mission, at least its name, its client, its period and its status.

**Who may do what**

- **FR-022**: The system MUST resolve the acting user and their role server-side, and MUST NOT trust a role claimed by the client.
- **FR-023**: The system MUST refuse creation, modification, closure and assignment operations to anyone who is not a manager, and MUST enforce this independently of whether the interface offers the action.
- **FR-024**: The interface MUST NOT offer manager-only actions to a consultant, this being a convenience on top of the server-side rule and never a substitute for it.
- **FR-025**: A consultant MUST be able to see the missions they are assigned to, and MUST NOT be able to browse missions they are not assigned to.

**Presentation**

- **FR-026**: The interface MUST present every label, status, message and date to the user in French.
- **FR-027**: The interface MUST make the loading, error and empty situations of the mission list and of the assignment screen explicit rather than showing a blank screen.
- **FR-028**: The interface MUST show the server's own explanation when an operation is refused, rather than a generic failure message.
- **FR-029**: The interface MUST convey a mission's status by a label or an icon and not by colour alone.

### Key Entities *(include if feature involves data)*

- **Mission**: A client engagement activity can be charged to. Carries a name, a client, a start date, an optional end date, a description and a status of running or closed. Its name is unique within a client. Never deleted.
- **Assignment**: The link making a mission chargeable by a given consultant. Joins exactly one consultant and one mission, at most once. Carries no period of its own — the mission's period governs.
- **Client**: The customer a mission is run for. Identified by its name on the mission; not managed as a separate catalogue by this feature.
- **Manager**: The acting user allowed to create, modify, close and staff missions. Role resolved server-side.
- **Consultant**: The user a mission may be assigned to, and who charges activity against it. Sees only their own assigned missions.
- **Declaration (CRA entry)**: Belongs to the monthly timesheet feature; referenced here only because closure and detachment must leave it untouched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager creates a mission and staffs it with two consultants in under one minute, without help.
- **SC-002**: Those consultants find the new mission offered on their next timesheet entry, with no further action by anyone.
- **SC-003**: 100% of attempts to create a duplicate mission name within one client are refused, and 100% of the same names across different clients are accepted.
- **SC-004**: 100% of attempts by a consultant to create, modify, close or staff a mission are refused, whether made through the interface or by a direct request to the server.
- **SC-005**: 100% of attempts to declare activity on a mission that is closed, outside its period, or not assigned to the declaring consultant, are refused.
- **SC-006**: After closing a mission, every declaration previously recorded against it, and every monthly total containing one, is byte-for-byte identical to before — verified on a month that contains such declarations.
- **SC-007**: Filtering a catalogue of at least 50 missions by any combination of client, status and consultant returns exactly the matching missions, with zero false positives and zero misses.
- **SC-008**: The mission list reaches a usable state in under two seconds for a catalogue of 50 missions.
- **SC-009**: Automated tests cover, for every business rule listed above, at least one case that fails if the rule is removed; backend and frontend coverage stay at or above the project's 70% floor.

## Assumptions

- **Language**: this engineering specification is written in English per the project convention that code and technical artefacts are English; everything the end user reads stays French. The French source story remains the customer-facing artefact.
- **Closure is a status, not a date**: closing is an explicit manager action that sets the mission's status, distinct from its end date. The source story's *"n'apparaît plus pour les saisies futures"* is read as "is no longer offered for any new declaration from now on", not as "is only blocked for dates in the future". A closed mission therefore accepts no new declaration at all, whatever the date.
- **Reopening a closed mission is out of scope.** A mission closed by mistake is handled outside this feature; if reopening turns out to be needed, it is a separate change.
- **Assignments carry no dates of their own.** The source story attaches the notion of being "active sur la période" to the mission, so the mission's start and end dates govern. Consultant rotations that need their own windows would be a later evolution.
- **Detachment is in scope** even though the source story only mentions assigning: "gérer les missions (… consultants affectés)" is read as covering the whole lifecycle of an assignment, and a demo where a consultant can be attached but never detached would be visibly incomplete.
- **Any manager may manage any mission.** No notion of mission ownership or of a manager's own team is introduced; the source story does not mention one.
- **Consultants may read, not browse.** A consultant can see the missions they are assigned to; the filterable catalogue of criterion 5 is a manager screen. This keeps criterion 6's restriction meaningful without hiding from consultants the missions they work on.
- **Client is a free-text attribute**, not a managed catalogue with its own screens; the source story lists it as a field of the mission.
- **Assignees are consultants.** Assigning a manager to a mission is not supported.
- **Identity and roles** come from US-001. This feature consumes the server-side resolution of the acting user and their role, and defines none of its own.
- **Scale**: this is a demo dataset — tens of missions, a handful of consultants and clients.

## Dependencies

- **US-001 (authentification)** — supplies the server-side resolution of the acting user and their `CONSULTANT` / `MANAGER` role. Required before the role restrictions (FR-022 to FR-025) can be exercised for real. Not yet implemented at the time of writing.
- **US-003 (saisie du CRA mensuel)** — consumes this feature. It calls on the declarable-mission set (FR-013) to populate its mission choice and relies on closure and detachment leaving declarations untouched (FR-012, FR-018). It must not be built before this feature exists.
- **US-006 (validation manager)** and **US-007 (tableau de bord)** — will read missions and assignments to group and present activity; nothing in this feature should make a mission unreadable once closed.
