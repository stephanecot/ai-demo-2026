"""Domain error hierarchy and the exception handlers that shape every error response.

Contract (ADR-0002): **every** non-2xx response body is `{"detail": <french string>}`,
safe to display to the user as is. FastAPI's default 422 body is list-shaped, so it is
flattened here into a single sentence.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class DomainError(Exception):
    """Base class for business errors raised by the service layer.

    `message` is French and user-facing; `status_code` is the HTTP status it maps to.
    """

    status_code: int = 400
    default_message: str = "La demande n'a pas pu être traitée."

    def __init__(self, message: str | None = None) -> None:
        self.message: str = message or self.default_message
        super().__init__(self.message)


class NotFoundError(DomainError):
    """The resource does not exist, or is not visible to the caller."""

    status_code = 404
    default_message = "Ressource introuvable."


class ForbiddenError(DomainError):
    """The caller's role or ownership does not allow this action."""

    status_code = 403
    default_message = "Action non autorisée."


class UnauthorizedError(DomainError):
    """No usable demo identity was provided."""

    status_code = 401
    default_message = "Profil de démonstration inconnu."


class ConflictError(DomainError):
    """A business rule forbids the operation in the current state."""

    status_code = 409
    default_message = "Cette opération est impossible dans l'état actuel."


# --- 422 flattening -------------------------------------------------------------------

# Starlette's own default messages, translated so no English reaches the user.
_HTTP_DEFAULT_MESSAGES: dict[str, str] = {
    "Not Found": "Ressource introuvable.",
    "Method Not Allowed": "Méthode non autorisée.",
    "Unauthorized": "Profil de démonstration inconnu.",
    "Forbidden": "Action non autorisée.",
    "Internal Server Error": "Une erreur interne est survenue.",
}

# Pydantic v2 error types → French sentence templates, keyed by error type prefix.
_VALIDATION_MESSAGES: dict[str, str] = {
    "missing": "Le champ « {field} » est obligatoire.",
    "string_too_short": "Le champ « {field} » ne peut pas être vide.",
    "string_too_long": "Le champ « {field} » est trop long.",
    "string_type": "Le champ « {field} » doit être un texte.",
    "int_parsing": "Le champ « {field} » doit être un nombre entier.",
    "int_type": "Le champ « {field} » doit être un nombre entier.",
    "float_parsing": "Le champ « {field} » doit être un nombre.",
    "float_type": "Le champ « {field} » doit être un nombre.",
    "bool_parsing": "Le champ « {field} » doit être un booléen.",
    "bool_type": "Le champ « {field} » doit être un booléen.",
    "date_parsing": "Le champ « {field} » doit être une date au format AAAA-MM-JJ.",
    "date_from_datetime_parsing": "Le champ « {field} » doit être une date au format AAAA-MM-JJ.",
    "datetime_parsing": "Le champ « {field} » doit être une date et une heure valides.",
    "enum": "Le champ « {field} » a une valeur non autorisée.",
    "literal_error": "Le champ « {field} » a une valeur non autorisée.",
    "greater_than": "Le champ « {field} » a une valeur trop petite.",
    "greater_than_equal": "Le champ « {field} » a une valeur trop petite.",
    "less_than": "Le champ « {field} » a une valeur trop grande.",
    "less_than_equal": "Le champ « {field} » a une valeur trop grande.",
    "value_error": "Le champ « {field} » est invalide.",
}

_UNKNOWN_FIELD_MESSAGE = "La requête est invalide."
_DEFAULT_FIELD_MESSAGE = "Le champ « {field} » est invalide."

# Wire name (the camelCase alias Pydantic puts in `loc`, see `CamelModel`) → French label.
# The user must never read a technical identifier, so an unmapped field falls back to
# `_UNKNOWN_FIELD_MESSAGE` instead of leaking its name. **Extend this map with every new
# request schema field** — a missing entry silently degrades the message, it never crashes.
_FIELD_LABELS: dict[str, str] = {
    # User
    "name": "nom",
    "email": "adresse e-mail",
    "role": "rôle",
    "userId": "utilisateur",
    # Mission
    "client": "client",
    "label": "libellé",
    "startDate": "date de début",
    "endDate": "date de fin",
    "missionId": "mission",
    # Cra
    "craId": "compte rendu d'activité",
    "year": "année",
    "month": "mois",
    "status": "statut",
    "comment": "commentaire",
    # CraEntry
    "day": "jour",
    "date": "date",
    "type": "type d'activité",
    "entryType": "type d'activité",
    "fraction": "fraction de journée",
    # Notification
    "message": "message",
}

# Location prefixes that name the request part, not the field itself.
_LOCATION_PREFIXES = frozenset({"body", "query", "path", "header", "cookie"})


def _field_name(location: tuple[object, ...]) -> str | None:
    """Return the wire name of a Pydantic error location, or None when there is none."""
    parts = [str(part) for part in location if isinstance(part, str)]
    if parts and parts[0] in _LOCATION_PREFIXES:
        parts = parts[1:]
    return parts[-1] if parts else None


def _field_label(location: tuple[object, ...]) -> str | None:
    """Return the French label of the field at fault, or None when it has no label."""
    name = _field_name(location)
    return None if name is None else _FIELD_LABELS.get(name)


def _validation_message(error: dict[str, object]) -> str:
    """Turn one Pydantic error dict into one French sentence, free of technical names."""
    label = _field_label(tuple(error.get("loc", ())))
    if label is None:
        return _UNKNOWN_FIELD_MESSAGE
    error_type = str(error.get("type", ""))
    template = _VALIDATION_MESSAGES.get(error_type, _DEFAULT_FIELD_MESSAGE)
    return template.format(field=label)


def flatten_validation_errors(errors: list[dict[str, object]]) -> str:
    """Flatten FastAPI's list-shaped 422 detail into a single French string."""
    messages: list[str] = []
    for error in errors:
        message = _validation_message(error)
        if message not in messages:
            messages.append(message)
    return " ".join(messages) if messages else _UNKNOWN_FIELD_MESSAGE


# --- handlers -------------------------------------------------------------------------


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Map a service-layer domain error to its HTTP status and French detail."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return a 422 whose `detail` is a string, like every other error response."""
    errors: list[dict[str, object]] = [dict(error) for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": flatten_validation_errors(errors)})


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Guarantee a French string `detail` even for framework-raised HTTP errors."""
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": _HTTP_DEFAULT_MESSAGES.get(detail, detail)},
        headers=getattr(exc, "headers", None),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last resort: a bug must still answer `{"detail": <french string>}`, never plain text.

    Starlette runs this one in `ServerErrorMiddleware`, i.e. *outside* `CORSMiddleware`, so
    a 500 returned on a direct `:8000` call carries no CORS header. That is accepted: the
    dev proxy makes the frontend same-origin, and reordering the middleware to fix it would
    put the CORS layer above the error layer, which is worse.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": _HTTP_DEFAULT_MESSAGES["Internal Server Error"]},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Install every handler that enforces the `{"detail": string}` error contract."""
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
