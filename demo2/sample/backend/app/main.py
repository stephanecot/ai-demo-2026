"""Application factory: lifespan, CORS, exception handlers, router registration."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.db.seed import seed_demo_data
from app.db.session import SessionLocal, init_db
from app.routers import health
from app.schemas.common import ERROR_RESPONSES


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create the schema and load the demo data before the first request."""
    init_db()
    with SessionLocal() as db:
        seed_demo_data(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API du Compte Rendu d'Activité — messages d'erreur en français.",
    lifespan=lifespan,
    # Every route inherits the `{"detail": string}` error shape in OpenAPI (ADR-0002).
    responses=ERROR_RESPONSES,
)

# The dev proxy makes the frontend same-origin; this is the safety net when :8000 is
# called directly (see docs/architecture/00-socle.md, section 4).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router)
# US-001: app.include_router(auth.router)
# US-002: app.include_router(missions.router)
# US-003: app.include_router(cra.router)
# US-006: app.include_router(validation.router)
# US-007: app.include_router(dashboard.router)
# US-009: app.include_router(exports.router)
# US-010: app.include_router(notifications.router)
