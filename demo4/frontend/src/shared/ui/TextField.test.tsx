import { render, screen } from '@testing-library/react'
import { TextField } from './TextField'

test('links the label to the input', () => {
  render(<TextField id="title" label="Titre" />)
  const input = screen.getByLabelText('Titre')
  expect(input).toHaveAttribute('id', 'title')
  expect(input).not.toHaveAttribute('aria-invalid')
})

test('shows the error and wires aria attributes', () => {
  render(<TextField id="title" label="Titre" error="Le titre est obligatoire" />)
  const input = screen.getByLabelText('Titre')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAttribute('aria-describedby', 'title-error')
  expect(screen.getByRole('alert')).toHaveTextContent('Le titre est obligatoire')
  expect(screen.getByRole('alert')).toHaveAttribute('id', 'title-error')
})
