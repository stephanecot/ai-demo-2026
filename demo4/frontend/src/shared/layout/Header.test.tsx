import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../../test/renderWithRouter'

test('shows logo, search placeholder and deposit link', async () => {
  renderApp('/')
  expect(await screen.findByText('leboncoin')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Rechercher sur leboncoin')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Déposer une annonce' })).toHaveAttribute('href', '/deposer')
})

test('navigates to /deposer without reload', async () => {
  const { router } = renderApp('/')
  await userEvent.click(await screen.findByRole('link', { name: 'Déposer une annonce' }))
  expect(router.state.location.pathname).toBe('/deposer')
  expect(await screen.findByRole('heading', { level: 1, name: 'Déposer une annonce' })).toBeInTheDocument()
})
