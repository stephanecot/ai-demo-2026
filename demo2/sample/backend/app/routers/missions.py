"""`/api/missions` — the mission catalogue (US-002).

Routes only: no business rule, no query. Everything the endpoints below decide lives in
`app/services/mission.py`.

ORDERING — `/disponibles` is declared before `/{mission_id}`. FastAPI matches in
declaration order, so the reverse would parse the literal as a mission id and answer 422.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_manager
from app.models.enums import MissionStatus
from app.models.user import User
from app.schemas.mission import AssignmentCreate, MissionCreate, MissionRead, MissionUpdate
from app.services import mission as mission_service

router = APIRouter(prefix="/api/missions", tags=["missions"])


@router.get("", response_model=list[MissionRead], summary="Liste des missions")
def list_missions(
    client: str | None = None,
    status: MissionStatus | None = None,
    user_id: int | None = Query(default=None, alias="userId"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MissionRead]:
    """Every mission for a manager; only their own for a consultant.

    `client`, `status` and `userId` (FR-020) combine with AND, on top of that scoping.
    """
    return mission_service.list_missions(
        db, current_user, client=client, status=status, user_id=user_id
    )


# `/disponibles` must be declared before `/{mission_id}`: FastAPI matches routes in
# declaration order, and the reverse would parse the literal as a mission id (D-07).
@router.get("/disponibles", response_model=list[MissionRead], summary="Missions déclarables")
def list_available_missions(
    date: date = Query(..., description="Jour pour lequel la mission doit être déclarable."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MissionRead]:
    """Missions the calling user may charge on `date` (FR-013). Consumed by US-003."""
    return mission_service.list_available_missions(db, current_user, date)


@router.get("/{mission_id}", response_model=MissionRead, summary="Détail d'une mission")
def read_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MissionRead:
    """Read one mission by its identifier.

    A manager reads any mission; a consultant only one they are assigned to (FR-025) —
    scoped in the service, answering 404 rather than 403 for one they are not on.
    """
    return mission_service.get_mission(db, current_user, mission_id)


@router.post(
    "",
    response_model=MissionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une mission",
)
def create_mission(
    payload: MissionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> MissionRead:
    """Record a new engagement. Manager only, enforced server-side."""
    return mission_service.create_mission(db, payload)


@router.put("/{mission_id}", response_model=MissionRead, summary="Modifier une mission")
def update_mission(
    mission_id: int,
    payload: MissionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> MissionRead:
    """Replace the editable fields of a mission. Manager only."""
    return mission_service.update_mission(db, mission_id, payload)


@router.post(
    "/{mission_id}/affectations",
    response_model=MissionRead,
    summary="Affecter des consultants à une mission",
)
def assign_consultants(
    mission_id: int,
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> MissionRead:
    """Attach one or several consultants in one action. Manager only, idempotent."""
    return mission_service.assign_consultants(db, mission_id, payload.user_ids)


@router.delete(
    "/{mission_id}/affectations/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Détacher un consultant d'une mission",
)
def detach_consultant(
    mission_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> None:
    """Remove one consultant. Manager only, a no-op when already absent."""
    mission_service.detach_consultant(db, mission_id, user_id)


@router.post("/{mission_id}/cloture", response_model=MissionRead, summary="Clôturer une mission")
def close_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> MissionRead:
    """Withdraw a mission from new declarations. Manager only, idempotent."""
    return mission_service.close_mission(db, mission_id)
