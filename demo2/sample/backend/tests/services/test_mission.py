"""Business rules of the mission catalogue, exercised without HTTP.

The API tests prove the rules are reachable; these prove they are *right*, including the
boundaries that are tedious to drive through a request.
"""

from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.models.enums import MissionStatus
from app.models.user import User
from app.schemas.mission import MissionCreate
from app.services import mission as mission_service


def _payload(**overrides: object) -> MissionCreate:
    data: dict[str, object] = {
        "label": "Migration Cloud",
        "client": "Initech",
        "start_date": date(2026, 1, 1),
        "end_date": None,
        "description": "",
    }
    data.update(overrides)
    return MissionCreate.model_validate(data)


def test_create_mission_strips_surrounding_whitespace(db: Session, manager: User) -> None:
    created = mission_service.create_mission(db, _payload(label="  Migration Cloud  "))

    assert created.label == "Migration Cloud"


def test_create_mission_defaults_to_active(db: Session, manager: User) -> None:
    created = mission_service.create_mission(db, _payload())

    assert created.status is MissionStatus.ACTIVE


def test_create_mission_rejects_a_duplicate_label_for_the_same_client(
    db: Session, manager: User
) -> None:
    mission_service.create_mission(db, _payload())

    with pytest.raises(ConflictError):
        mission_service.create_mission(db, _payload(label="MIGRATION CLOUD"))


def test_create_mission_allows_the_same_label_for_another_client(
    db: Session, manager: User
) -> None:
    mission_service.create_mission(db, _payload())

    other = mission_service.create_mission(db, _payload(client="Globex"))

    assert other.id is not None


def test_create_mission_rejects_an_end_date_before_the_start_date(
    db: Session, manager: User
) -> None:
    with pytest.raises(ConflictError) as excinfo:
        mission_service.create_mission(
            db, _payload(start_date=date(2026, 6, 1), end_date=date(2026, 5, 31))
        )

    assert excinfo.value.message == "La date de fin ne peut pas précéder la date de début."


def test_create_mission_accepts_an_end_date_equal_to_the_start_date(
    db: Session, manager: User
) -> None:
    """A one-day mission is legal: the rule is `end >= start`, not `end > start`."""
    created = mission_service.create_mission(
        db, _payload(start_date=date(2026, 6, 1), end_date=date(2026, 6, 1))
    )

    assert created.end_date == date(2026, 6, 1)


def test_update_mission_may_keep_its_own_label(db: Session, manager: User) -> None:
    """Editing a mission without renaming it must not collide with itself."""
    created = mission_service.create_mission(db, _payload())

    updated = mission_service.update_mission(db, created.id, _payload(description="Étendu."))

    assert updated.description == "Étendu."


# --- User Story 2 — assignment rules ---------------------------------------------------


def test_assign_consultants_is_idempotent_and_creates_no_duplicate(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(db, _payload())

    mission_service.assign_consultants(db, created.id, [consultant.id])
    twice = mission_service.assign_consultants(db, created.id, [consultant.id])

    assert [assignee.id for assignee in twice.assignees] == [consultant.id]


def test_assign_consultants_rejects_a_non_consultant(db: Session, manager: User) -> None:
    created = mission_service.create_mission(db, _payload())

    with pytest.raises(ConflictError):
        mission_service.assign_consultants(db, created.id, [manager.id])


def test_assign_consultants_raises_not_found_for_an_unknown_user(
    db: Session, manager: User
) -> None:
    created = mission_service.create_mission(db, _payload())

    with pytest.raises(NotFoundError):
        mission_service.assign_consultants(db, created.id, [4242])


def test_detach_consultant_is_a_noop_when_never_assigned(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(db, _payload())

    mission_service.detach_consultant(db, created.id, consultant.id)  # must not raise

    reread = mission_service.get_mission(db, manager, created.id)
    assert reread.assignees == []


def test_detach_consultant_preserves_other_assignments(
    db: Session, manager: User, consultant: User, other_consultant: User
) -> None:
    created = mission_service.create_mission(db, _payload())
    mission_service.assign_consultants(db, created.id, [consultant.id, other_consultant.id])

    mission_service.detach_consultant(db, created.id, consultant.id)

    reread = mission_service.get_mission(db, manager, created.id)
    assert [assignee.id for assignee in reread.assignees] == [other_consultant.id]


# --- User Story 3 — declarability boundaries --------------------------------------------
#
# Seed missions (`app/db/seed.py`) all run from 2025 onward and are already assigned to
# `consultant`/`other_consultant`, so these boundary checks use 2020 dates to stay clear
# of the demo dataset and prove the rule on the mission created here alone.


def test_list_available_missions_includes_the_start_date_boundary(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(
        db, _payload(start_date=date(2020, 6, 1), end_date=None)
    )
    mission_service.assign_consultants(db, created.id, [consultant.id])

    available = mission_service.list_available_missions(db, consultant, date(2020, 6, 1))

    assert [mission.id for mission in available] == [created.id]


def test_list_available_missions_includes_the_end_date_boundary(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(
        db, _payload(start_date=date(2020, 1, 1), end_date=date(2020, 6, 30))
    )
    mission_service.assign_consultants(db, created.id, [consultant.id])

    available = mission_service.list_available_missions(db, consultant, date(2020, 6, 30))

    assert [mission.id for mission in available] == [created.id]


def test_list_available_missions_excludes_a_closed_mission(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(
        db, _payload(start_date=date(2020, 1, 1), end_date=None)
    )
    mission_service.assign_consultants(db, created.id, [consultant.id])
    mission_service.close_mission(db, created.id)

    available = mission_service.list_available_missions(db, consultant, date(2020, 6, 1))

    assert available == []


# --- User Story 4 — closure rules -------------------------------------------------------


def test_close_mission_sets_status_only_and_leaves_end_date_untouched(
    db: Session, manager: User
) -> None:
    created = mission_service.create_mission(
        db, _payload(start_date=date(2026, 1, 1), end_date=date(2026, 12, 31))
    )

    closed = mission_service.close_mission(db, created.id)

    assert closed.status is MissionStatus.CLOSED
    assert closed.end_date == date(2026, 12, 31)


def test_close_mission_twice_is_a_noop(db: Session, manager: User) -> None:
    created = mission_service.create_mission(db, _payload())
    mission_service.close_mission(db, created.id)

    closed_again = mission_service.close_mission(db, created.id)

    assert closed_again.status is MissionStatus.CLOSED


# --- User Story 5 — filter composition ---------------------------------------------------


def test_list_missions_filters_combine_with_and(
    db: Session, manager: User, consultant: User
) -> None:
    matching = mission_service.create_mission(db, _payload(client="Wonka"))
    other_client = mission_service.create_mission(db, _payload(label="Other", client="Fabrikam"))
    mission_service.assign_consultants(db, matching.id, [consultant.id])
    mission_service.assign_consultants(db, other_client.id, [consultant.id])

    result = mission_service.list_missions(
        db, manager, client="Wonka", status=MissionStatus.ACTIVE, user_id=consultant.id
    )

    assert [mission.id for mission in result] == [matching.id]


def test_list_missions_client_filter_is_case_insensitive(db: Session, manager: User) -> None:
    mission_service.create_mission(db, _payload(client="Wonka"))

    result = mission_service.list_missions(db, manager, client="wonka")

    matching = [mission for mission in result if mission.client == "Wonka"]
    assert len(matching) == 1


# --- Role scoping of a single read (FR-025) -----------------------------------------------


def test_get_mission_as_manager_reads_any_mission(db: Session, manager: User) -> None:
    created = mission_service.create_mission(db, _payload())

    reread = mission_service.get_mission(db, manager, created.id)

    assert reread.id == created.id


def test_get_mission_as_the_assigned_consultant_reads_it(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(db, _payload())
    mission_service.assign_consultants(db, created.id, [consultant.id])

    reread = mission_service.get_mission(db, consultant, created.id)

    assert reread.id == created.id


def test_get_mission_as_an_unassigned_consultant_raises_not_found(
    db: Session, manager: User, consultant: User
) -> None:
    created = mission_service.create_mission(db, _payload())

    with pytest.raises(NotFoundError):
        mission_service.get_mission(db, consultant, created.id)
