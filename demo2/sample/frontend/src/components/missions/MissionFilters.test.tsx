import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { consultant, otherConsultant } from '../../test/fixtures'
import type { MissionFilters as MissionFiltersValue } from '../../types/dto'
import { MissionFilters } from './MissionFilters'

/**
 * `MissionFilters` is controlled: without a component keeping `value` in sync, typing
 * a second character would be compared against the stale, still-empty `value` prop.
 * This mirrors how `MissionsPage` actually uses it.
 */
function ControlledFilters({ onChange }: { onChange: (value: MissionFiltersValue) => void }) {
  const [value, setValue] = useState<MissionFiltersValue>({})
  return (
    <MissionFilters
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
      consultants={[]}
      consultantsStatus="ready"
    />
  )
}

describe('MissionFilters', () => {
  it('affiche des libellés français accessibles pour les trois filtres', () => {
    render(
      <MissionFilters
        value={{}}
        onChange={vi.fn()}
        consultants={[consultant]}
        consultantsStatus="ready"
      />,
    )

    expect(screen.getByLabelText('Client')).toBeInTheDocument()
    expect(screen.getByLabelText('Statut')).toBeInTheDocument()
    expect(screen.getByLabelText('Consultant')).toBeInTheDocument()
  })

  it('propose les statuts en français, jamais la valeur brute', () => {
    render(
      <MissionFilters value={{}} onChange={vi.fn()} consultants={[]} consultantsStatus="ready" />,
    )

    expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Clôturée' })).toBeInTheDocument()
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument()
  })

  it('reporte un changement de client sans filtrer localement', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ControlledFilters onChange={onChange} />)

    await user.type(screen.getByLabelText('Client'), 'ACME')

    expect(onChange).toHaveBeenLastCalledWith({ client: 'ACME' })
  })

  it('reporte un changement de statut', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MissionFilters value={{}} onChange={onChange} consultants={[]} consultantsStatus="ready" />,
    )

    await user.selectOptions(screen.getByLabelText('Statut'), 'Clôturée')

    expect(onChange).toHaveBeenCalledWith({ status: 'CLOSED' })
  })

  it('reporte un changement de consultant', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MissionFilters
        value={{}}
        onChange={onChange}
        consultants={[consultant, otherConsultant]}
        consultantsStatus="ready"
      />,
    )

    await user.selectOptions(screen.getByLabelText('Consultant'), consultant.name)

    expect(onChange).toHaveBeenCalledWith({ userId: consultant.id })
  })

  it('désactive le filtre consultant tant que la liste n’est pas prête', () => {
    render(
      <MissionFilters
        value={{}}
        onChange={vi.fn()}
        consultants={[]}
        consultantsStatus="loading"
      />,
    )

    expect(screen.getByLabelText('Consultant')).toBeDisabled()
  })

  it('efface le filtre client quand le champ est vidé', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MissionFilters
        value={{ client: 'ACME' }}
        onChange={onChange}
        consultants={[]}
        consultantsStatus="ready"
      />,
    )

    await user.clear(screen.getByLabelText('Client'))

    expect(onChange).toHaveBeenLastCalledWith({ client: undefined })
  })
})
