import { CATEGORIES, type Category } from '../../api/annonces'

/** Raw form values (strings straight from the inputs). */
export type AnnonceFormValues = {
  title: string
  category: string
  description: string
  price: string
  city: string
  postalCode: string
}

export type AnnonceField = keyof AnnonceFormValues

export type AnnonceErrors = Partial<Record<AnnonceField, string>>

export const FIELD_ORDER: AnnonceField[] = ['title', 'category', 'description', 'price', 'city', 'postalCode']

export const EMPTY_VALUES: AnnonceFormValues = {
  title: '',
  category: '',
  description: '',
  price: '',
  city: '',
  postalCode: '',
}

export const LIMITS = {
  title: { min: 5, max: 80 },
  description: { min: 20, max: 4000 },
  city: { max: 100 },
} as const

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

/**
 * Mirrors the backend's Jakarta rules (CreateAnnonceRequest) — same bounds, same French
 * messages. The API remains the source of truth; this only spares a round trip.
 */
export function validateAnnonce(values: AnnonceFormValues): AnnonceErrors {
  const errors: AnnonceErrors = {}

  const title = values.title.trim()
  if (!title) errors.title = 'Le titre est obligatoire'
  else if (title.length < LIMITS.title.min || title.length > LIMITS.title.max)
    errors.title = `Le titre doit contenir entre ${LIMITS.title.min} et ${LIMITS.title.max} caractères`

  if (!isCategory(values.category)) errors.category = 'La catégorie est obligatoire'

  const description = values.description.trim()
  if (!description) errors.description = 'La description est obligatoire'
  else if (description.length < LIMITS.description.min || description.length > LIMITS.description.max)
    errors.description = `La description doit contenir entre ${LIMITS.description.min} et ${LIMITS.description.max} caractères`

  const price = values.price.trim()
  if (!price) errors.price = 'Le prix est obligatoire'
  else if (!/^\d+$/.test(price)) errors.price = 'Le prix doit être un nombre entier en euros'
  else if (Number(price) < 0) errors.price = 'Le prix doit être supérieur ou égal à 0'

  const city = values.city.trim()
  if (!city) errors.city = 'La ville est obligatoire'
  else if (city.length > LIMITS.city.max) errors.city = `La ville doit contenir au plus ${LIMITS.city.max} caractères`

  const postalCode = values.postalCode.trim()
  if (!postalCode) errors.postalCode = 'Le code postal est obligatoire'
  else if (!/^\d{5}$/.test(postalCode)) errors.postalCode = 'Le code postal doit contenir 5 chiffres'

  return errors
}

/** Converts validated form values into the API payload. Call only when validateAnnonce() is empty. */
export function toCreateInput(values: AnnonceFormValues) {
  if (!isCategory(values.category)) throw new Error('category must be validated first')
  return {
    title: values.title.trim(),
    category: values.category,
    description: values.description.trim(),
    price: Number(values.price.trim()),
    city: values.city.trim(),
    postalCode: values.postalCode.trim(),
  }
}
