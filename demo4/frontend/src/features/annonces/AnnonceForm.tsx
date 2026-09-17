import { type FormEvent, useRef, useState } from 'react'
import { type Annonce, CATEGORIES, CATEGORY_LABELS, createAnnonce } from '../../api/annonces'
import { ApiError } from '../../api/http'
import { Button, Select, TextArea, TextField } from '../../shared/ui'
import styles from './AnnonceForm.module.css'
import {
  type AnnonceErrors,
  type AnnonceField,
  type AnnonceFormValues,
  EMPTY_VALUES,
  FIELD_ORDER,
  LIMITS,
  toCreateInput,
  validateAnnonce,
} from './validation'

export const NETWORK_ERROR_MESSAGE = "Impossible de déposer l'annonce, réessayez."

const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))

type FieldControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

type Props = {
  onCreated: (annonce: Annonce) => void
}

export function AnnonceForm({ onCreated }: Props) {
  const [values, setValues] = useState<AnnonceFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<AnnonceErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const controls = useRef<Partial<Record<AnnonceField, FieldControl | null>>>({})

  const bind = (field: AnnonceField) => ({
    name: field,
    value: values[field],
    error: errors[field],
    ref: (element: FieldControl | null) => {
      controls.current[field] = element
    },
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
    },
  })

  const focusFirstError = (fieldErrors: AnnonceErrors) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field])
    if (first) controls.current[first]?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBanner(null)
    const clientErrors = validateAnnonce(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      focusFirstError(clientErrors)
      return
    }

    setSubmitting(true)
    try {
      onCreated(await createAnnonce(toCreateInput(values)))
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.problem.errors?.length) {
        const apiErrors: AnnonceErrors = {}
        for (const { field, message } of error.problem.errors) {
          if ((FIELD_ORDER as string[]).includes(field)) apiErrors[field as AnnonceField] = message
        }
        setErrors(apiErrors)
        focusFirstError(apiErrors)
      } else {
        setBanner(NETWORK_ERROR_MESSAGE)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {banner && (
        <p className={styles.banner} role="alert">
          {banner}
        </p>
      )}
      <TextField
        id="title"
        label="Titre de l'annonce"
        placeholder="Ex : Vélo de course en très bon état"
        maxLength={LIMITS.title.max}
        autoComplete="off"
        {...bind('title')}
      />
      <Select
        id="category"
        label="Catégorie"
        placeholder="Choisissez une catégorie"
        options={CATEGORY_OPTIONS}
        {...bind('category')}
      />
      <TextArea
        id="description"
        label="Description"
        placeholder="Décrivez votre bien : état, dimensions, raison de la vente…"
        hint={`Entre ${LIMITS.description.min} et ${LIMITS.description.max} caractères`}
        maxLength={LIMITS.description.max}
        {...bind('description')}
      />
      <TextField
        id="price"
        label="Prix (€)"
        inputMode="numeric"
        placeholder="0"
        hint="Indiquez 0 pour un don"
        {...bind('price')}
      />
      <div className={styles.row}>
        <TextField id="city" label="Ville" placeholder="Ex : Lyon" autoComplete="address-level2" {...bind('city')} />
        <TextField
          id="postalCode"
          label="Code postal"
          inputMode="numeric"
          placeholder="Ex : 69003"
          maxLength={5}
          autoComplete="postal-code"
          {...bind('postalCode')}
        />
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Envoi en cours…' : 'Déposer mon annonce'}
        </Button>
      </div>
    </form>
  )
}
