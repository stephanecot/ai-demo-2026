import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('rend son contenu', () => {
    render(<Card>Trois missions en cours</Card>)

    expect(screen.getByText('Trois missions en cours')).toBeInTheDocument()
  })

  it('expose le titre comme un en-tête de niveau 2', () => {
    render(<Card title="État de l’API">Contenu</Card>)

    expect(screen.getByRole('heading', { level: 2, name: 'État de l’API' })).toBeInTheDocument()
  })

  it('rend les actions à côté du titre', () => {
    render(
      <Card title="Missions" actions={<button type="button">Ajouter</button>}>
        Contenu
      </Card>,
    )

    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  // The rule under test: no title and no actions means no header at all, so an
  // untitled card does not open with an empty band above its content.
  it('n’ajoute aucun en-tête quand il n’a ni titre ni actions', () => {
    render(<Card>Contenu</Card>)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('rend les actions seules quand la carte n’a pas de titre', () => {
    render(<Card actions={<button type="button">Ajouter</button>}>Contenu</Card>)

    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
