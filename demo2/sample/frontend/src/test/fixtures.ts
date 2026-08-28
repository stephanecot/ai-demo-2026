import type { Mission, UserSummary } from '../types/dto'

/** Shared fixtures for the mission-management screens (US-002). */

export const manager: UserSummary = { id: 1, name: 'Alice Martin', role: 'MANAGER' }

export const consultant: UserSummary = { id: 2, name: 'Jean Dupont', role: 'CONSULTANT' }

export const otherConsultant: UserSummary = { id: 3, name: 'Fatou Diop', role: 'CONSULTANT' }

export const activeMission: Mission = {
  id: 10,
  label: 'Refonte SI',
  client: 'ACME',
  startDate: '2026-01-01',
  endDate: null,
  description: 'Refonte du SI de gestion.',
  status: 'ACTIVE',
  assignees: [consultant],
}

export const closedMission: Mission = {
  id: 11,
  label: 'Migration cloud',
  client: 'Globex',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  description: 'Migration des serveurs vers le cloud.',
  status: 'CLOSED',
  assignees: [],
}
