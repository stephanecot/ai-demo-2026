import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('déclenche l’action au clic', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Enregistrer</Button>)

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // The rule under test: `loading` must block a second submission, not merely
  // draw a spinner — a double-click on « Soumettre » would submit the CRA twice.
  it('reste désactivé et signale l’attente pendant le chargement', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Soumettre
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Soumettre' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await user.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })

  it('n’appelle pas l’action quand il est désactivé', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Valider
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('soumet le formulaire qui le contient quand son type est submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: FormEvent) => {
      event.preventDefault()
    })
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Créer</Button>
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Créer' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
