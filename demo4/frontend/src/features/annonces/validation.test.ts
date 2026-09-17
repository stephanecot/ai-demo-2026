import { type AnnonceFormValues, toCreateInput, validateAnnonce } from './validation'

const valid: AnnonceFormValues = {
  title: 'Vélo de course',
  category: 'LOISIRS',
  description: 'Vélo de course en très bon état, peu servi.',
  price: '350',
  city: 'Lyon',
  postalCode: '69003',
}

test('valid values produce no error', () => {
  expect(validateAnnonce(valid)).toEqual({})
})

test.each<[keyof AnnonceFormValues, string, string]>([
  ['title', '', 'Le titre est obligatoire'],
  ['title', 'Vélo', 'Le titre doit contenir entre 5 et 80 caractères'],
  ['title', 'x'.repeat(81), 'Le titre doit contenir entre 5 et 80 caractères'],
  ['category', '', 'La catégorie est obligatoire'],
  ['category', 'BATEAUX', 'La catégorie est obligatoire'],
  ['description', '', 'La description est obligatoire'],
  ['description', 'Trop court', 'La description doit contenir entre 20 et 4000 caractères'],
  ['description', 'x'.repeat(4001), 'La description doit contenir entre 20 et 4000 caractères'],
  ['price', '', 'Le prix est obligatoire'],
  ['price', '-1', 'Le prix doit être un nombre entier en euros'],
  ['price', '12.5', 'Le prix doit être un nombre entier en euros'],
  ['city', '   ', 'La ville est obligatoire'],
  ['city', 'x'.repeat(101), 'La ville doit contenir au plus 100 caractères'],
  ['postalCode', '', 'Le code postal est obligatoire'],
  ['postalCode', '6900', 'Le code postal doit contenir 5 chiffres'],
  ['postalCode', 'ABCDE', 'Le code postal doit contenir 5 chiffres'],
])('%s = %j → "%s"', (field, value, message) => {
  const errors = validateAnnonce({ ...valid, [field]: value })
  expect(errors).toEqual({ [field]: message })
})

test('boundaries are inclusive (5/80, 20/4000, price 0)', () => {
  expect(
    validateAnnonce({ ...valid, title: 'x'.repeat(5), description: 'x'.repeat(20), price: '0' }),
  ).toEqual({})
  expect(validateAnnonce({ ...valid, title: 'x'.repeat(80), description: 'x'.repeat(4000) })).toEqual({})
})

test('toCreateInput trims and converts the price', () => {
  expect(toCreateInput({ ...valid, title: '  Vélo de course ', price: ' 350 ' })).toEqual({
    title: 'Vélo de course',
    category: 'LOISIRS',
    description: 'Vélo de course en très bon état, peu servi.',
    price: 350,
    city: 'Lyon',
    postalCode: '69003',
  })
})
