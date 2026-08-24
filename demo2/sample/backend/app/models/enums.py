"""Closed value sets of the domain. The French labels live in the frontend."""

from enum import StrEnum


class UserRole(StrEnum):
    """Who the user is allowed to be."""

    CONSULTANT = "CONSULTANT"
    MANAGER = "MANAGER"


class CraStatus(StrEnum):
    """Lifecycle of a monthly timesheet: DRAFT → SUBMITTED → APPROVED,
    or SUBMITTED → REJECTED → DRAFT. An APPROVED CRA is immutable."""

    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class EntryType(StrEnum):
    """What a consultant declares on a given day."""

    MISSION = "MISSION"
    PAID_LEAVE = "PAID_LEAVE"  # Congé payé
    RTT = "RTT"
    SICK_LEAVE = "SICK_LEAVE"  # Maladie
    UNPAID_LEAVE = "UNPAID_LEAVE"  # Sans solde
    TRAINING = "TRAINING"  # Formation
