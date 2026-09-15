import { request } from './http'

export const CATEGORIES = [
  'VEHICULES',
  'IMMOBILIER',
  'MULTIMEDIA',
  'MAISON',
  'LOISIRS',
  'MODE',
  'EMPLOI',
  'SERVICES',
  'AUTRES',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  VEHICULES: 'Véhicules',
  IMMOBILIER: 'Immobilier',
  MULTIMEDIA: 'Multimédia',
  MAISON: 'Maison',
  LOISIRS: 'Loisirs',
  MODE: 'Mode',
  EMPLOI: 'Emploi',
  SERVICES: 'Services',
  AUTRES: 'Autres',
}

export type CreateAnnonceInput = {
  title: string
  category: Category
  description: string
  price: number
  city: string
  postalCode: string
}

export type Annonce = CreateAnnonceInput & {
  id: string
  createdAt: string
}

export function createAnnonce(input: CreateAnnonceInput): Promise<Annonce> {
  return request<Annonce>('/api/annonces', { method: 'POST', json: input })
}

export function getAnnonce(id: string): Promise<Annonce> {
  return request<Annonce>(`/api/annonces/${encodeURIComponent(id)}`)
}
