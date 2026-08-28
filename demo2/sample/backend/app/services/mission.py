"""Every business rule of the mission catalogue (US-002).

Routers hold none of this. The rules here are, in order of importance:

- a mission label is unique per client, case-insensitively (FR-004, FR-005);
- an end date never precedes a start date (FR-006);
- a mission is withdrawn by closing it, never by deleting it (FR-007);
- a consultant may only charge a mission they are assigned to, that is not closed, and
  whose period covers the day (FR-013, FR-014).
"""

from datetime import date

from sqlalchemy import Select, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import ConflictError, NotFoundError
from app.models.assignment import Assignment
from app.models.enums import MissionStatus, UserRole
from app.models.mission import Mission
from app.models.user import User
from app.schemas.mission import MissionCreate, MissionRead, MissionUpdate
from app.schemas.user import UserRead

MISSION_NOT_FOUND = "Mission introuvable."
USER_NOT_FOUND = "Utilisateur introuvable."


def _base_query() -> Select[tuple[Mission]]:
    """Every read goes through here: `assignees` is always embedded, so a lazy relation
    would issue one query per mission and another per assignment (the N+1 of
    `python-dont.md`). `selectinload` keeps it to three queries whatever the list size."""
    return (
        select(Mission)
        .options(selectinload(Mission.assignments).selectinload(Assignment.user))
        .order_by(Mission.client, Mission.label)
    )


def _to_read(mission: Mission) -> MissionRead:
    """Map the aggregate to its response shape. The mapping lives here rather than in the
    schema module so that `app.schemas` never has to import `app.models`."""
    return MissionRead(
        id=mission.id,
        label=mission.label,
        client=mission.client,
        start_date=mission.start_date,
        end_date=mission.end_date,
        description=mission.description,
        status=mission.status,
        assignees=[UserRead.model_validate(assignment.user) for assignment in mission.assignments],
    )


def _get_or_404(db: Session, mission_id: int) -> Mission:
    mission = db.scalar(_base_query().where(Mission.id == mission_id))
    if mission is None:
        raise NotFoundError(MISSION_NOT_FOUND)
    return mission


def _ensure_dates_ordered(start: date, end: date | None) -> None:
    """A one-day mission is legal: the rule is `end >= start`, not `end > start`."""
    if end is not None and end < start:
        raise ConflictError("La date de fin ne peut pas précéder la date de début.")


def _ensure_label_free(db: Session, client: str, label: str, exclude_id: int | None = None) -> None:
    """Both columns are NOCASE, so `==` compares case-insensitively without a `lower()`.

    `exclude_id` is what lets a mission be edited without colliding with itself.
    """
    query = select(Mission.id).where(Mission.client == client, Mission.label == label)
    if exclude_id is not None:
        query = query.where(Mission.id != exclude_id)
    if db.scalar(query) is not None:
        raise ConflictError(f"Une mission « {label} » existe déjà pour ce client.")


def _is_assigned(user: User, mission: Mission) -> bool:
    return any(assignment.user_id == user.id for assignment in mission.assignments)


def get_mission(db: Session, current_user: User, mission_id: int) -> MissionRead:
    """Read one mission, or refuse with a French 404.

    A manager may read any mission; a consultant only one they are assigned to
    (FR-025). Refusing with 404 rather than 403 when they are not: a 403 would confirm
    the mission exists, which is itself a leak (contract note, 2026-08-28).
    """
    mission = _get_or_404(db, mission_id)
    if current_user.role is not UserRole.MANAGER and not _is_assigned(current_user, mission):
        raise NotFoundError(MISSION_NOT_FOUND)
    return _to_read(mission)


def list_missions(
    db: Session,
    current_user: User,
    client: str | None = None,
    status: MissionStatus | None = None,
    user_id: int | None = None,
) -> list[MissionRead]:
    """Every mission for a manager; only their own for a consultant (FR-025).

    The optional filters (FR-020) combine with AND and apply on top of that role
    scoping, so a consultant can never widen their view by passing `userId`.
    """
    query = _base_query()
    if current_user.role is not UserRole.MANAGER:
        query = query.where(Mission.assignments.any(Assignment.user_id == current_user.id))
    if client is not None:
        query = query.where(Mission.client == client)
    if status is not None:
        query = query.where(Mission.status == status)
    if user_id is not None:
        query = query.where(Mission.assignments.any(Assignment.user_id == user_id))
    return [_to_read(mission) for mission in db.scalars(query)]


def list_available_missions(
    db: Session, current_user: User, target_date: date
) -> list[MissionRead]:
    """Missions the calling user may charge on `target_date` (FR-013, FR-014).

    Assigned to them, ACTIVE, and whose period covers the date — an open `end_date`
    never excludes a mission that has already started.
    """
    query = _base_query().where(
        Mission.assignments.any(Assignment.user_id == current_user.id),
        Mission.status == MissionStatus.ACTIVE,
        Mission.start_date <= target_date,
        or_(Mission.end_date.is_(None), Mission.end_date >= target_date),
    )
    return [_to_read(mission) for mission in db.scalars(query)]


def create_mission(db: Session, payload: MissionCreate) -> MissionRead:
    """Record a new engagement. Commits once — one service call per request."""
    _ensure_dates_ordered(payload.start_date, payload.end_date)
    _ensure_label_free(db, payload.client, payload.label)

    mission = Mission(
        label=payload.label,
        client=payload.client,
        start_date=payload.start_date,
        end_date=payload.end_date,
        description=payload.description,
        status=MissionStatus.ACTIVE,
    )
    db.add(mission)
    db.commit()
    return _to_read(_get_or_404(db, mission.id))


def update_mission(db: Session, mission_id: int, payload: MissionUpdate) -> MissionRead:
    """Replace the editable fields of a mission. Status and assignees are untouched."""
    mission = _get_or_404(db, mission_id)
    _ensure_dates_ordered(payload.start_date, payload.end_date)
    _ensure_label_free(db, payload.client, payload.label, exclude_id=mission.id)

    mission.label = payload.label
    mission.client = payload.client
    mission.start_date = payload.start_date
    mission.end_date = payload.end_date
    mission.description = payload.description
    db.commit()
    return _to_read(_get_or_404(db, mission.id))


def _ensure_assignable(db: Session, user_id: int) -> None:
    """A user can be attached to a mission only if they exist and are a consultant."""
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(USER_NOT_FOUND)
    if user.role is not UserRole.CONSULTANT:
        raise ConflictError("Seul un consultant peut être affecté à une mission.")


def assign_consultants(db: Session, mission_id: int, user_ids: list[int]) -> MissionRead:
    """Attach one or several consultants to a mission in one action (FR-008).

    Idempotent per (user, mission) pair (FR-010, D-10): a consultant already assigned is
    skipped rather than re-inserted, so a repeated call never fails and never duplicates.
    Every candidate is validated before anything is added, so a single invalid id leaves
    no partial assignment behind.
    """
    mission = _get_or_404(db, mission_id)
    already_assigned = {assignment.user_id for assignment in mission.assignments}
    to_add = [user_id for user_id in user_ids if user_id not in already_assigned]
    for user_id in to_add:
        _ensure_assignable(db, user_id)
    for user_id in to_add:
        db.add(Assignment(mission_id=mission.id, user_id=user_id))
    db.commit()
    return _to_read(_get_or_404(db, mission.id))


def detach_consultant(db: Session, mission_id: int, user_id: int) -> None:
    """Remove one consultant from a mission (FR-009).

    A no-op, not an error, when the assignment was already absent (D-10). Only the
    assignment row is touched — no declaration is ever reachable from here (FR-012).
    """
    _get_or_404(db, mission_id)
    assignment = db.scalar(
        select(Assignment).where(Assignment.mission_id == mission_id, Assignment.user_id == user_id)
    )
    if assignment is not None:
        db.delete(assignment)
        db.commit()


def close_mission(db: Session, mission_id: int) -> MissionRead:
    """Withdraw a mission from new declarations (FR-016, FR-017).

    Sets `status` only — never `end_date` (D-04) — and is a no-op on an already closed
    mission (FR-016 scenario 5, D-10), so a double click never reports a failure.
    """
    mission = _get_or_404(db, mission_id)
    if mission.status is not MissionStatus.CLOSED:
        mission.status = MissionStatus.CLOSED
        db.commit()
    return _to_read(_get_or_404(db, mission.id))
