import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CraStatus } from '../../types/dto'
import { StatusBadge } from './StatusBadge'

const CASES: Array<[CraStatus, string]> = [
  ['DRAFT', 'Brouillon'],
  ['SUBMITTED', 'Soumis'],
  ['APPROVED', 'Validé'],
  ['REJECTED', 'Refusé'],
]

describe('StatusBadge', () => {
  // The rule under test: the status is carried by a French label, never by colour alone.
  it.each(CASES)('affiche le libellé français du statut %s', (status, label) => {
    render(<StatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('ne rend jamais la valeur brute de l’énumération', () => {
    render(<StatusBadge status="SUBMITTED" />)

    expect(screen.queryByText('SUBMITTED')).not.toBeInTheDocument()
  })
})
