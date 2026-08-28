import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { activeMission, closedMission } from '../../test/fixtures'
import { MissionTable } from './MissionTable'

describe('MissionTable', () => {
  it('affiche le libellé, le client, la période, le statut et les affectés', () => {
    render(<MissionTable missions={[activeMission]} />)

    expect(screen.getByText(activeMission.label)).toBeInTheDocument()
    expect(screen.getByText(activeMission.client)).toBeInTheDocument()
    expect(screen.getByText(/du 01 janvier 2026/i)).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
  })

  it('affiche « Aucun » quand la mission n’a aucun affecté', () => {
    render(<MissionTable missions={[closedMission]} />)

    expect(screen.getByText('Aucun')).toBeInTheDocument()
    expect(screen.getByText('Clôturée')).toBeInTheDocument()
  })

  it('ne montre aucune action à un consultant', () => {
    render(<MissionTable missions={[activeMission]} canManage={false} />)

    expect(screen.queryByRole('button', { name: /modifier/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /affecter/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /clôturer/i })).not.toBeInTheDocument()
  })

  it('propose Modifier, Affecter et Clôturer à un manager pour une mission active', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onManageAssignees = vi.fn()
    const onClose = vi.fn()
    render(
      <MissionTable
        missions={[activeMission]}
        canManage
        onEdit={onEdit}
        onManageAssignees={onManageAssignees}
        onClose={onClose}
      />,
    )

    await user.click(screen.getByRole('button', { name: /modifier\s*refonte si/i }))
    expect(onEdit).toHaveBeenCalledWith(activeMission)

    await user.click(
      screen.getByRole('button', { name: /affecter\s*des consultants à refonte si/i }),
    )
    expect(onManageAssignees).toHaveBeenCalledWith(activeMission)

    await user.click(screen.getByRole('button', { name: /clôturer\s*refonte si/i }))
    expect(onClose).toHaveBeenCalledWith(activeMission)
  })

  it('ne propose pas de Clôturer pour une mission déjà clôturée', () => {
    render(<MissionTable missions={[closedMission]} canManage onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /clôturer/i })).not.toBeInTheDocument()
  })
})
