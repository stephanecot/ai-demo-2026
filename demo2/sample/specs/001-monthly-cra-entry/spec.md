# Feature Specification: Monthly CRA Entry

**Feature Branch**: `001-product-management`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "Implement l'US US-003-saisie-cra-mensuel qui se trouve dans /demos/specs"

**Source story**: `demo2/specs/US-003-saisie-cra-mensuel.md` — *En tant que consultant, je veux saisir mes jours travaillés dans une vue calendrier mensuelle, afin de déclarer mon activité du mois de façon simple et rapide.*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Declare worked days on a monthly calendar (Priority: P1)

A consultant opens the timesheet for a given month and sees every day of that month laid out
as a calendar. On any open day they declare activity on one of their missions, either as a
full day or as a half day. A running total of declared days is shown and updates immediately
after every change. Each change is saved on its own, without the consultant pressing a save
button, and they can remove a declaration they made by mistake.

**Why this priority**: This is the core of the product — without it a consultant cannot
declare anything and the whole timesheet workflow (submission, validation, exports) has no
input. On its own it already delivers the full value promised by the story title.

**Independent Test**: Open the current month for a consultant who has at least one active
mission, declare a full day and a half day on two open dates, observe the running total go to
1.5, reload the page, and confirm both declarations are still there without any explicit save.

**Acceptance Scenarios**:

1. **Given** a consultant with an active mission and an open timesheet for the current month, **When** they open the monthly view, **Then** every day of that month is displayed, with each day's already-declared activity visible.
2. **Given** an open day with nothing declared, **When** the consultant declares a full day on an active mission, **Then** the day shows 1 day on that mission and the monthly total increases by 1.
3. **Given** an open day with nothing declared, **When** the consultant declares a half day on an active mission, **Then** the day shows 0.5 day on that mission and the monthly total increases by 0.5.
4. **Given** a declaration the consultant just made, **When** they remove it, **Then** the day returns to empty and the monthly total decreases accordingly.
5. **Given** any change to a declaration, **When** the change is accepted, **Then** it is persisted automatically and the consultant is told the month is saved, without them triggering a save action.
6. **Given** a change that could not be persisted, **When** the save fails, **Then** the consultant is told in French that the change was not saved and the unsaved change remains visible so it is not silently lost.
7. **Given** a consultant with no active mission, **When** they open the monthly view, **Then** the calendar is shown with an explanatory message in French instead of a mission choice, and no declaration is possible.

---

### User Story 2 - Split a day across several missions (Priority: P2)

A consultant who worked for two clients on the same day declares half a day on each mission.
The system guarantees that the declared quantity for one calendar day never exceeds one day,
whatever the number of missions involved.

**Why this priority**: Multi-mission days are common for consultants and are the reason half
days exist at all, but a consultant can already declare a valid month without this. It also
carries the single most important business rule of the feature, so it must not be deferred
further than P2.

**Independent Test**: On one open day, declare 0.5 on mission A then 0.5 on mission B and
confirm both are accepted and the day totals 1; then attempt to add anything else on that day
and confirm it is rejected with a French explanation.

**Acceptance Scenarios**:

1. **Given** an open day with 0.5 day already declared on mission A, **When** the consultant declares 0.5 day on mission B, **Then** both declarations coexist and the day totals 1 day.
2. **Given** an open day with 1 day already declared on mission A, **When** the consultant tries to declare 0.5 day on mission B, **Then** the declaration is refused and a French message explains that the day is already full.
3. **Given** an open day with 0.5 day already declared on mission A, **When** the consultant tries to declare a full day on mission B, **Then** the declaration is refused and the existing 0.5 day on mission A is left untouched.
4. **Given** an open day with 0.5 day declared on mission A, **When** the consultant tries to declare a second 0.5 day on that same mission A, **Then** the declaration is refused rather than creating a duplicate line for the same day and mission.
5. **Given** any declaration attempt, **When** the requested quantity is neither a full day nor a half day, **Then** it is refused.

---

### User Story 3 - Keep non-working days out of the way (Priority: P2)

Weekends and French public holidays are shown as non-working: visually set apart from open
days and not available for declaration. The consultant sees at a glance how many working days
the month actually holds.

**Why this priority**: It prevents a large class of accidental wrong declarations and makes
the calendar readable, but the calendar is usable without it. It ranks alongside User Story 2
because the two together define what "a valid month" means.

**Independent Test**: Open a month containing a public holiday, confirm every Saturday, Sunday
and the holiday are marked as non-working and carry a French reason, and confirm no
declaration can be made on them.

**Acceptance Scenarios**:

1. **Given** any displayed month, **When** the calendar is rendered, **Then** every Saturday and Sunday is marked as non-working.
2. **Given** a month containing a French public holiday, **When** the calendar is rendered, **Then** that date is marked as non-working and its French name is available to the consultant.
3. **Given** a non-working day, **When** the consultant attempts to declare activity on it, **Then** the attempt is refused, both in the interface and when the request reaches the server directly. [NEEDS CLARIFICATION: the source story says non-working days are blocked "par défaut" — is there an explicit override letting a consultant declare weekend or holiday work, or is the block absolute for this feature?]
4. **Given** any month of any year, **When** the set of French public holidays for that year is requested, **Then** the fixed holidays and the Easter-derived holidays for that year are returned, without the consultant having to configure anything.

---

### User Story 4 - Only touch what may still be changed (Priority: P3)

A consultant can only modify a timesheet that is still open and belongs to a period they are
allowed to declare. A timesheet already submitted or validated is shown read-only, and a
month further ahead than the next one cannot be declared at all.

**Why this priority**: These guards matter for the integrity of the validation workflow, but
they only become observable once submission (US-005) exists. The read-only behaviour must
nonetheless be built in from the start so that no path exists to alter a submitted month.

**Independent Test**: Open a submitted timesheet and confirm the calendar renders with its
status but no way to change anything; then navigate to the month after next and confirm entry
is unavailable with a French explanation.

**Acceptance Scenarios**:

1. **Given** a timesheet whose status is submitted, validated or rejected-pending-rework in a locked state, **When** the consultant opens it, **Then** the month and its declarations are displayed read-only with the status shown in French, and no declaration control is offered.
2. **Given** a locked timesheet, **When** a modification request reaches the server anyway, **Then** it is refused as a business-rule conflict rather than silently applied.
3. **Given** the current month is M, **When** the consultant navigates to month M+1, **Then** declaration is available.
4. **Given** the current month is M, **When** the consultant navigates to month M+2 or later, **Then** the calendar may be displayed but declaration is refused, with a French explanation.
5. **Given** a consultant, **When** they attempt to read or modify another user's timesheet, **Then** the attempt is refused.
6. **Given** a consultant opening a month for which no timesheet exists yet, **When** the month is within the allowed range, **Then** an empty open timesheet is made available to them so they can start declaring immediately.

---

### Edge Cases

- A month with no open day at all (every day a weekend or holiday) renders a readable calendar with a zero total and no possible declaration.
- February in a leap year shows 29 days; a 31-day month shows 31; the calendar never shows a day belonging to another month as declarable.
- A public holiday falling on a Saturday or Sunday is counted once, not twice, and remains non-working.
- Two changes made in quick succession on the same day resolve to a single consistent stored state; the last accepted change wins and the displayed total matches what is stored.
- A declaration on a mission that ended before, or starts after, the declared date is refused.
- A declaration on a mission the consultant is not assigned to is refused, even if that mission exists.
- The consultant loses connectivity mid-month: changes that could not be saved are reported as unsaved rather than shown as saved.
- The monthly total is always displayed with at most one decimal (for example 12.5), never as a rounded or accumulated floating-point artefact.

## Requirements *(mandatory)*

### Functional Requirements

**Reading the month**

- **FR-001**: The system MUST expose, for a given consultant, year and month, the full list of that month's days together with the declarations already recorded and the timesheet status.
- **FR-002**: The system MUST mark each day of the month as working or non-working, a non-working day being a Saturday, a Sunday or a French public holiday.
- **FR-003**: The system MUST compute the French public holidays of any requested year, covering both fixed-date holidays and those derived from Easter, and expose them independently of any timesheet.
- **FR-004**: The system MUST create an open timesheet on demand when a consultant opens a month within the allowed range and none exists yet.
- **FR-005**: The system MUST compute the monthly total of declared days from the stored declarations and MUST NOT store that total as a separate persisted value.

**Declaring**

- **FR-006**: Consultants MUST be able to record, for one open day and one of their active missions, a quantity of either one full day or one half day.
- **FR-007**: Consultants MUST be able to remove a declaration they previously recorded on an open timesheet.
- **FR-008**: The system MUST reject any quantity other than a full day or a half day.
- **FR-009**: The system MUST reject a declaration that would bring the total declared quantity for a single calendar day above one day.
- **FR-010**: The system MUST allow several declarations on the same day provided they concern different missions and their total stays at or below one day.
- **FR-011**: The system MUST hold at most one declaration per combination of day and mission.
- **FR-012**: The system MUST reject a declaration on a mission the consultant is not actively assigned to on that date.
- **FR-013**: The system MUST reject a declaration on a non-working day.
- **FR-014**: The system MUST accept a batch of changes for one month in a single operation, applying either all of them or none, so the stored month is never left half-updated.

**Period and lifecycle guards**

- **FR-015**: The system MUST refuse any modification of a timesheet that is not in the open state.
- **FR-016**: The system MUST allow declaration on past months and on the current month, and on the next month only; any month beyond the next one MUST be refused for declaration.
- **FR-017**: The system MUST resolve the acting consultant server-side and MUST refuse any read or write of a timesheet belonging to another user.

**Feedback to the consultant**

- **FR-018**: The interface MUST save every accepted change automatically, without an explicit save action by the consultant.
- **FR-019**: The interface MUST show the consultant the current saving state of the month: saving in progress, all changes saved, or a change that failed to save.
- **FR-020**: The interface MUST display the monthly total and refresh it immediately on every accepted change, without waiting for the save to complete.
- **FR-021**: The interface MUST present every message, label, day name, month name and status to the consultant in French, and MUST show the server's own explanation when a declaration is refused rather than a generic failure message.
- **FR-022**: The interface MUST make the loading, error and empty situations of the monthly view explicit rather than showing a blank screen.
- **FR-023**: The interface MUST let the consultant move to the previous and next month and MUST make the displayed month unambiguous.
- **FR-024**: The interface MUST convey a day's state (open, non-working, declared, locked) by a label or an icon and not by colour alone.

### Key Entities *(include if feature involves data)*

- **Timesheet (CRA)**: A consultant's declaration for one calendar month. Identified by consultant, year and month; carries a lifecycle status; holds the declarations of that month. Unique per consultant and month.
- **Declaration (CRA entry)**: One line of activity: a date, a kind of activity, a mission, and a quantity of either one or one half day. Belongs to exactly one timesheet. At most one line per date and mission.
- **Mission**: A client engagement a consultant may declare against, with a validity period. Comes from the missions feature; this feature only reads it.
- **Assignment**: The link making a mission declarable by a given consultant over a period. Comes from the missions feature; this feature only reads it.
- **Public holiday**: A date in the French calendar with a French name, derived from the year rather than stored per year.
- **Consultant (User)**: The acting person, resolved server-side; owns their timesheets and sees no one else's.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consultant can declare a complete standard month (around 20 working days) in under two minutes, without ever pressing a save button.
- **SC-002**: The monthly total displayed matches the sum of the declarations stored for that month in 100% of cases, checked after a page reload.
- **SC-003**: 100% of attempts to exceed one day on a single date are refused, whether made through the interface or by a direct request to the server.
- **SC-004**: 100% of attempts to modify a submitted or validated timesheet, to declare beyond the next month, or to touch another consultant's timesheet, are refused.
- **SC-005**: Every weekend day and every French public holiday of a displayed month is marked non-working, with zero false positives and zero misses, verified across a full year.
- **SC-006**: A change made by the consultant is durably saved, or reported as not saved, within three seconds — the consultant is never left believing a lost change was recorded.
- **SC-007**: The monthly view reaches a usable state in under two seconds for a month containing a declaration on every working day.
- **SC-008**: A first-time consultant declares their first day without instructions, on the first attempt.
- **SC-009**: Automated tests cover, for every business rule listed in the requirements, at least one case that fails if the rule is removed; backend and frontend coverage stay at or above the project's 70% floor.

## Assumptions

- **Language**: this engineering specification is written in English per the project convention that code and technical artefacts are English; everything the consultant reads stays French. The French source story remains the customer-facing artefact.
- **Identity**: the acting consultant is resolved server-side from the demo identity mechanism introduced by US-001 (authentication). This feature consumes that mechanism and does not define its own.
- **Missions**: active missions and their assignments come from US-002 (mission management). Until that feature exists, this feature reads whatever mission and assignment data the seeded demo dataset provides; it never lets a consultant declare against a mission they are not assigned to.
- **Absences**: only mission activity is declared here. Paid leave, RTT, sick leave and training are declared by US-004 (absences). The one-day-per-date ceiling defined here counts every declaration on that date whatever its kind, so absences added later fall under the same rule without changing it.
- **Submission**: this feature only reads the timesheet status and refuses to modify a locked one. Submitting, validating and rejecting belong to US-005 and US-006.
- **Half days are not timed**: a half day carries no morning/afternoon distinction; two half days on one date simply coexist.
- **Public holidays**: the French metropolitan calendar is used; Alsace-Moselle's two additional holidays are out of scope. Holidays are computed from the year, not maintained in a table.
- **Past months**: declaration on a past month stays possible as long as its timesheet is still open; no closing deadline is enforced by this feature.
- **Autosave cadence**: changes are sent shortly after the consultant stops interacting rather than on every keystroke, and consecutive changes to the same month are coalesced into one save.
- **Single device**: a consultant edits a given month from one place at a time; no cross-device merge of concurrent edits is attempted.
- **Scale**: this is a demo dataset — a handful of consultants and missions, one month at a time on screen.

## Dependencies

- **US-001 (authentication)** — supplies the server-side resolution of the acting consultant and their role. Required before the ownership guard (FR-017) can be exercised for real.
- **US-002 (mission management)** — supplies missions and assignments. Required before a declaration can reference a real active mission (FR-012).
- **US-005 (submission)** — will drive the timesheet out of the open state. This feature must already refuse to modify a non-open timesheet (FR-015) before that story lands.
- **US-004 (absences)** — will add non-mission declarations that share the one-day-per-date ceiling defined here (FR-009).
