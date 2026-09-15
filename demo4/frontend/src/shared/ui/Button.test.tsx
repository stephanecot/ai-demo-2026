import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

test('calls onClick when enabled', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Déposer</Button>)
  await userEvent.click(screen.getByRole('button', { name: 'Déposer' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('is not clickable when disabled', async () => {
  const onClick = vi.fn()
  render(
    <Button onClick={onClick} disabled>
      Déposer
    </Button>,
  )
  const button = screen.getByRole('button', { name: 'Déposer' })
  expect(button).toBeDisabled()
  await userEvent.click(button)
  expect(onClick).not.toHaveBeenCalled()
})

test('defaults to type=button', () => {
  render(<Button>OK</Button>)
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
})
