"""Engine, session factory and schema creation."""

import sqlite3

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine.interfaces import DBAPIConnection
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import ConnectionPoolEntry

from app.core.config import settings
from app.db.base import Base

engine: Engine = create_engine(
    settings.database_url,
    # SQLite only: uvicorn serves requests from a thread pool.
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(
    dbapi_connection: DBAPIConnection, connection_record: ConnectionPoolEntry
) -> None:
    """SQLite ignores foreign keys unless they are switched on per connection."""
    if not isinstance(dbapi_connection, sqlite3.Connection):
        return
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_db() -> None:
    """Create every table declared on `Base.metadata`. Safe to call repeatedly."""
    # Importing the models package registers every mapping before create_all runs.
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
