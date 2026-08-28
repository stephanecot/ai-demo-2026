/**
 * Code value -> French label. Single mapping module: a raw enum value, an English
 * word or an ISO date must never reach the screen.
 */
import type {
  CraStatus,
  EntryType,
  IsoDate,
  IsoDateTime,
  MissionStatus,
  UserRole,
} from './types/dto'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CONSULTANT: 'Consultant',
  MANAGER: 'Manager',
}

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
}

export const CRA_STATUS_LABELS: Record<CraStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  APPROVED: 'Validé',
  REJECTED: 'Refusé',
}

/** Long labels, used in menus and legends. */
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  MISSION: 'Mission',
  PAID_LEAVE: 'Congé payé',
  RTT: 'RTT',
  SICK_LEAVE: 'Maladie',
  UNPAID_LEAVE: 'Congé sans solde',
  TRAINING: 'Formation',
}

/** Short labels, used inside calendar cells where space is tight. */
export const ENTRY_TYPE_SHORT_LABELS: Record<EntryType, string> = {
  MISSION: 'Mission',
  PAID_LEAVE: 'CP',
  RTT: 'RTT',
  SICK_LEAVE: 'Maladie',
  UNPAID_LEAVE: 'Sans solde',
  TRAINING: 'Formation',
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * "2026-08-24" -> "24 août 2026". Returns the raw value if it is not parsable.
 *
 * The parts are parsed explicitly on purpose: `new Date("2026-08-24")` yields
 * midnight UTC, which `Intl.DateTimeFormat` then renders in the local zone —
 * one day earlier anywhere west of UTC. An `IsoDate` is a calendar day, not an
 * instant, so it must be built as a local date.
 */
export function formatDate(value: IsoDate): string {
  const match = ISO_DATE_PATTERN.exec(value)
  if (match === null) {
    return value
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  // Rejects impossible days (2026-02-31), which JavaScript would silently roll over.
  const isSameDay =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isSameDay ? DATE_FORMAT.format(date) : value
}

/** "2026-08-24T09:30:00Z" -> "24 août 2026 à 11:30" (local time). */
export function formatDateTime(value: IsoDateTime): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMAT.format(date)
}

/** 1 -> "1 j", 0.5 -> "0,5 j". */
export function formatDayFraction(value: number): string {
  return `${value.toLocaleString('fr-FR')} j`
}
