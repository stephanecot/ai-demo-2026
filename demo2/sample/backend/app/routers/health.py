"""`GET /api/health` — the only public endpoint: it answers with or without `X-Demo-User`."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.common import HealthRead
from app.services import health as health_service

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("", response_model=HealthRead, summary="État de l'API et de sa base de données")
def read_health(db: Session = Depends(get_db)) -> HealthRead:
    """Return 200 even when the database is down, with `status` set to `degraded`."""
    return health_service.read_health(db)
