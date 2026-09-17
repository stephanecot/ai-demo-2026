import { screen } from '@testing-library/react'
import { renderApp } from './test/renderWithRouter'

test('renders the home page inside the layout', async () => {
  renderApp('/')
  expect(await screen.findByRole('heading', { level: 1, name: 'Bientôt : les annonces' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'leboncoin, accueil' })).toBeInTheDocument()
})
