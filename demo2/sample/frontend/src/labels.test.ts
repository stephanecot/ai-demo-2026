import { afterEach, describe, expect, it, vi } from 'vitest'
import { CRA_STATUS_LABELS, formatDate, formatDateTime, formatDayFraction } from './labels'

/**
 * Re-imports the module under a given timezone. The `Intl.DateTimeFormat` instances
 * are created at import time, so the zone has to be set before the import.
 */
async function withTimeZone<T>(
  timeZone: string,
  format: (labels: typeof import('./labels')) => T,
): Promise<T> {
  vi.stubEnv('TZ', timeZone)
  vi.resetModules()
  const labels = await import('./labels')
  return format(labels)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    expect(formatDate('2026-08-24')).toBe('24 août 2026')
  })

  // Regression: `new Date("2026-08-24")` is midnight UTC, rendered in local time —
  // one day earlier west of UTC. An IsoDate is a calendar day, not an instant.
  it('ne décale pas la date dans un fuseau à l’ouest de UTC', async () => {
    const formatted = await withTimeZone('America/New_York', (labels) =>
      labels.formatDate('2026-08-24'),
    )

    expect(formatted).toBe('24 août 2026')
  })

  it('ne décale pas la date dans un fuseau à l’est de UTC', async () => {
    const formatted = await withTimeZone('Pacific/Auckland', (labels) =>
      labels.formatDate('2026-08-24'),
    )

    expect(formatted).toBe('24 août 2026')
  })

  it('formate le premier jour de l’année sans changer d’année', async () => {
    const formatted = await withTimeZone('America/Los_Angeles', (labels) =>
      labels.formatDate('2026-01-01'),
    )

    expect(formatted).toBe('01 janvier 2026')
  })

  it('retourne la valeur brute quand elle n’est pas une date ISO', () => {
    expect(formatDate('pas-une-date')).toBe('pas-une-date')
  })

  it('retourne la valeur brute quand le jour n’existe pas', () => {
    expect(formatDate('2026-02-31')).toBe('2026-02-31')
  })
})

describe('formatDateTime', () => {
  // An IsoDateTime is an instant: converting it to the reader's local zone is intended.
  it('convertit un instant UTC dans le fuseau local', async () => {
    const formatted = await withTimeZone('Europe/Paris', (labels) =>
      labels.formatDateTime('2026-08-24T09:30:00Z'),
    )

    expect(formatted).toBe('24 août 2026 à 11:30')
  })

  it('retourne la valeur brute quand elle n’est pas parsable', () => {
    expect(formatDateTime('pas-une-date')).toBe('pas-une-date')
  })
})

describe('formatDayFraction', () => {
  it('formate une journée entière', () => {
    expect(formatDayFraction(1)).toBe('1 j')
  })

  it('formate une demi-journée avec la virgule décimale française', () => {
    expect(formatDayFraction(0.5)).toBe('0,5 j')
  })
})

describe('CRA_STATUS_LABELS', () => {
  it('traduit chaque statut en français', () => {
    expect(CRA_STATUS_LABELS).toEqual({
      DRAFT: 'Brouillon',
      SUBMITTED: 'Soumis',
      APPROVED: 'Validé',
      REJECTED: 'Refusé',
    })
  })
})
