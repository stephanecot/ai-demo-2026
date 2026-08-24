"""Declarative base shared by every SQLAlchemy model."""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Deterministic constraint names, so SQLite keeps readable errors and future
# schema changes never depend on an auto-generated identifier.
NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class of all models; `Base.metadata` drives `create_all`."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
