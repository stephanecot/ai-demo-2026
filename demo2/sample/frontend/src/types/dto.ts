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

/** Whether a mission still accepts new declarations. Independent of its period. */
export type MissionStatus = 'ACTIVE' | 'CLOSED'

/** A user as embedded in another payload: never the whole user, just who they are. */
export type UserSummary = {
  id: number
  name: string
  role: UserRole
}

/** GET /api/missions, GET /api/missions/{id}, GET /api/missions/disponibles */
export type Mission = {
  id: number
  label: string
  client: string
  startDate: IsoDate
  /** null means the mission runs indefinitely. */
  endDate: IsoDate | null
  description: string
  status: MissionStatus
  assignees: UserSummary[]
}

/**
 * Body of POST /api/missions and PUT /api/missions/{id}.
 * `status` and `assignees` are deliberately absent: status changes only through the
 * closure route, assignees only through the assignment routes.
 */
export type MissionCreate = {
  label: string
  client: string
  startDate: IsoDate
  endDate: IsoDate | null
  description: string
}

/** Query parameters of GET /api/missions. Combined with AND; omitted keys are ignored. */
export type MissionFilters = {
  client?: string
  status?: MissionStatus
  userId?: number
}

/** Body of POST /api/missions/{id}/affectations. */
export type AssignmentCreate = {
  userIds: number[]
}

/** Body of every non-2xx response; the message is French and displayable as is. */
export type ErrorResponse = {
  detail: string
}
