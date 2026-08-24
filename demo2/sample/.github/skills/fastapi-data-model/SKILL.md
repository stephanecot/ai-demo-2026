---
name: fastapi-data-model
description: Use when creating or changing SQLAlchemy models, enums, constraints or the demo seed data of the CRA backend — entities User, Mission, Assignment, Cra, CraEntry, Notification.
---

# CRA data model

Follow `.github/instructions/python-do.instructions.md`. One module per aggregate under `app/models/`.

## Entities

| Entity | Purpose | Key fields |
|---|---|---|
| `User` | consultant or manager | `id`, `first_name`, `last_name`, `role`, `manager_id` |
| `Mission` | client engagement | `id`, `name`, `client`, `start_date`, `end_date`, `is_closed` |
| `Assignment` | consultant ↔ mission | `user_id`, `mission_id` |
| `Cra` | one monthly timesheet | `id`, `user_id`, `year`, `month`, `status`, `submitted_at`, `reviewed_at`, `reviewer_id`, `rejection_comment` |
| `CraEntry` | one declaration on one day | `id`, `cra_id`, `day`, `entry_type`, `mission_id`, `fraction` |
| `Notification` | in-app message | `id`, `user_id`, `kind`, `message`, `target_url`, `created_at`, `read_at` |

## Enums

```python
class UserRole(StrEnum):
    CONSULTANT = "CONSULTANT"
    MANAGER = "MANAGER"

class CraStatus(StrEnum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class EntryType(StrEnum):
    MISSION = "MISSION"
    PAID_LEAVE = "PAID_LEAVE"        # Congé payé
    RTT = "RTT"
    SICK_LEAVE = "SICK_LEAVE"        # Maladie
    UNPAID_LEAVE = "UNPAID_LEAVE"    # Sans solde
    TRAINING = "TRAINING"            # Formation
```

Store enum members, never raw strings. The French label lives in the frontend.

## Mapping example

```python
class Cra(Base):
    __tablename__ = "cra"
    __table_args__ = (UniqueConstraint("user_id", "year", "month", name="uq_cra_user_month"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), index=True)
    year: Mapped[int]
    month: Mapped[int]
    status: Mapped[CraStatus] = mapped_column(default=CraStatus.DRAFT)
    submitted_at: Mapped[datetime | None] = None
    rejection_comment: Mapped[str | None] = mapped_column(String(500), default=None)

    entries: Mapped[list["CraEntry"]] = relationship(
        back_populates="cra", cascade="all, delete-orphan"
    )
```

## Invariants

Enforce in the database where possible, always in the service:

- One CRA per user, year and month → `UniqueConstraint` above.
- `fraction` is `1.0` or `0.5` → `CheckConstraint("fraction IN (0.5, 1.0)")`.
- Sum of fractions on one day ≤ `1.0` → service rule (`cra_service.add_entry`).
- `entry_type == MISSION` requires `mission_id`; any absence type forbids it.
- A `CraEntry` cannot exist on a weekend or a French public holiday.
- No mutation when `cra.status is CraStatus.APPROVED`.

## Derived values — never stored

Monthly totals, worked days, days per mission, remaining working days: computed from
`entries` in the service. Persisting them creates drift.

## Seed data

`app/db/seed.py`, called from the lifespan handler when the `user` table is empty:

- `Paul Durand` — MANAGER
- `Jean Dupont`, `Marie Martin` — CONSULTANT, `manager_id = Paul.id`
- 3 missions (2 clients), each assigned to both consultants
- one `APPROVED` CRA from the previous month for Jean, so the history screen is not empty

Keep the seed idempotent and deterministic — no random values, no `datetime.now()` for
seeded business dates.

## Checklist

- [ ] One module per aggregate; enums in `app/models/enums.py`.
- [ ] Foreign keys indexed; `cascade` set on owned collections.
- [ ] Business invariants covered by a constraint or a service rule, and tested.
- [ ] No derived value persisted.
- [ ] Seed runs on an empty database and is idempotent.
- [ ] `MissionRead`-style schemas use `from_attributes=True`.
