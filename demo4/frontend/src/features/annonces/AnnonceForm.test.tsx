import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Annonce } from '../../api/annonces'
import { AnnonceForm, NETWORK_ERROR_MESSAGE } from './AnnonceForm'
import { DeposerPage } from './DeposerPage'

const created: Annonce = {
  id: '6f1c2c4e-8a1d-4f0e-9b3a-1d2e3f4a5b6c',
  title: 'Vélo de course',
  category: 'LOISIRS',
  description: 'Vélo de course en très bon état, peu servi.',
  price: 1250,
  city: 'Lyon',
  postalCode: '69003',
  createdAt: '2026-09-15T10:00:00Z',
}

function jsonResponse(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Titre de l'annonce"), 'Vélo de course')
  await user.selectOptions(screen.getByLabelText('Catégorie'), 'LOISIRS')
  await user.type(screen.getByLabelText('Description'), 'Vélo de course en très bon état, peu servi.')
  await user.type(screen.getByLabelText('Prix (€)'), '1250')
  await user.type(screen.getByLabelText('Ville'), 'Lyon')
  await user.type(screen.getByLabelText('Code postal'), '69003')
}

test('valid submission calls the API, disables the button, then shows the confirmation', async () => {
  const user = userEvent.setup()
  let resolveFetch: (response: Response) => void = () => {}
  fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (resolveFetch = resolve)))
  render(<DeposerPage />)

  await fillValidForm(user)
  await user.click(screen.getByRole('button', { name: 'Déposer mon annonce' }))

  expect(screen.getByRole('button', { name: 'Envoi en cours…' })).toBeDisabled()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toBe('/api/annonces')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body as string)).toEqual({
    title: 'Vélo de course',
    category: 'LOISIRS',
    description: 'Vélo de course en très bon état, peu servi.',
    price: 1250,
    city: 'Lyon',
    postalCode: '69003',
  })

  resolveFetch(jsonResponse(201, created))

  expect(await screen.findByRole('heading', { name: 'Votre annonce est en ligne' })).toBeInTheDocument()
  expect(screen.getByText('Vélo de course')).toBeInTheDocument()
  expect(screen.getByText('1 250 €')).toBeInTheDocument()
  expect(screen.getByText('Loisirs')).toBeInTheDocument()
  expect(screen.getByText('Lyon (69003)')).toBeInTheDocument()
})

test('client validation blocks the API call, shows messages and focuses the first invalid field', async () => {
  const user = userEvent.setup()
  render(<AnnonceForm onCreated={vi.fn()} />)

  await user.type(screen.getByLabelText("Titre de l'annonce"), 'Vélo')
  await user.click(screen.getByRole('button', { name: 'Déposer mon annonce' }))

  expect(fetchMock).not.toHaveBeenCalled()
  const title = screen.getByLabelText("Titre de l'annonce")
  expect(title).toHaveFocus()
  expect(title).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText('Le titre doit contenir entre 5 et 80 caractères')).toBeInTheDocument()
  expect(screen.getByText('La catégorie est obligatoire')).toBeInTheDocument()
  expect(screen.getByText('Le code postal est obligatoire')).toBeInTheDocument()
})

test('API 400 with errors[] maps each message under its field', async () => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValueOnce(
    jsonResponse(
      400,
      {
        status: 400,
        title: 'Requête invalide',
        errors: [{ field: 'postalCode', message: 'Le code postal doit contenir 5 chiffres' }],
      },
      'application/problem+json',
    ),
  )
  render(<AnnonceForm onCreated={vi.fn()} />)

  await fillValidForm(user)
  await user.click(screen.getByRole('button', { name: 'Déposer mon annonce' }))

  expect(await screen.findByText('Le code postal doit contenir 5 chiffres')).toBeInTheDocument()
  expect(screen.getByLabelText('Code postal')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByLabelText('Code postal')).toHaveFocus()
  expect(screen.getByRole('button', { name: 'Déposer mon annonce' })).toBeEnabled()
})

test.each([
  ['a 500 response', () => Promise.resolve(new Response('boom', { status: 500 }))],
  ['a network failure', () => Promise.reject(new TypeError('Failed to fetch'))],
])('%s shows the banner and keeps the values', async (_label, fetchImpl) => {
  const user = userEvent.setup()
  fetchMock.mockImplementationOnce(fetchImpl)
  const onCreated = vi.fn()
  render(<AnnonceForm onCreated={onCreated} />)

  await fillValidForm(user)
  await user.click(screen.getByRole('button', { name: 'Déposer mon annonce' }))

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(NETWORK_ERROR_MESSAGE))
  expect(onCreated).not.toHaveBeenCalled()
  expect(screen.getByLabelText("Titre de l'annonce")).toHaveValue('Vélo de course')
  expect(screen.getByLabelText('Code postal')).toHaveValue('69003')
  expect(screen.getByRole('button', { name: 'Déposer mon annonce' })).toBeEnabled()
})
