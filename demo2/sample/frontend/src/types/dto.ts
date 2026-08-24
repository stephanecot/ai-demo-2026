/**
 * Hand-written mirrors of the backend Pydantic schemas (see ADR-0002).
 * The wire format is camelCase; every closed value set is a union type.
 * This module is the ONLY place where an API payload shape is declared.
 */

/** Calendar day, ISO 8601: "2026-08-24". Never rendered as is. */
export type IsoDate = string

/** Instant, ISO 8601 UTC: "2026-08-24T09:30:00Z". Never rendered as is. */
export type IsoDateTime = string

export type UserRole = 'CONSULTANT' | 'MANAGER'

export type CraStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type EntryType =
  | 'MISSION'
  | 'PAID_LEAVE'
  | 'RTT'
  | 'SICK_LEAVE'
  | 'UNPAID_LEAVE'
  | 'TRAINING'

/** A worked or absent day is always a whole or a half day. */
export type DayFraction = 0.5 | 1

/** GET /api/health — public, works with or without the X-Demo-User header. */
export type Health = {
  status: 'ok' | 'degraded'
  version: string
  database: 'ok' | 'ko'
  time: IsoDateTime
}

/** Body of every non-2xx response; the message is French and displayable as is. */
export type ErrorResponse = {
  detail: string
}
