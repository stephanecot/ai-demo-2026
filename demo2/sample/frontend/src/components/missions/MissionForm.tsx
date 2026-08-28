import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Mission, MissionCreate } from '../../types/dto'
import { Button, ErrorBanner } from '../ui'
import './MissionForm.css'

type Props = {
  /** Set when editing; absent when creating. */
  mission?: Mission
  onSubmit: (payload: MissionCreate) => void
  onCancel: () => void
  submitting?: boolean
  /** Backend `detail`, already French — shown verbatim. */
  error?: string | null
}

function initialValues(mission?: Mission): MissionCreate {
  return {
    label: mission?.label ?? '',
    client: mission?.client ?? '',
    startDate: mission?.startDate ?? '',
    endDate: mission?.endDate ?? null,
    description: mission?.description ?? '',
  }
}

/** Create or edit a mission. Presentational: it never calls the API itself. */
export function MissionForm({ mission, onSubmit, onCancel, submitting = false, error }: Props) {
  const [values, setValues] = useState<MissionCreate>(() => initialValues(mission))

  const update = (patch: Partial<MissionCreate>) => {
    setValues((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ ...values, endDate: values.endDate === '' ? null : values.endDate })
  }

  return (
    <form
      className="mission-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label={mission === undefined ? 'Nouvelle mission' : 'Modifier la mission'}
    >
      {error === null || error === undefined ? null : <ErrorBanner message={error} />}

      <div className="mission-form__grid">
        <div className="mission-form__field">
          <label htmlFor="mission-label">Libellé</label>
          <input
            id="mission-label"
            required
            value={values.label}
            onChange={(event) => update({ label: event.target.value })}
          />
        </div>

        <div className="mission-form__field">
          <label htmlFor="mission-client">Client</label>
          <input
            id="mission-client"
            required
            value={values.client}
            onChange={(event) => update({ client: event.target.value })}
          />
        </div>

        <div className="mission-form__field">
          <label htmlFor="mission-start-date">Date de début</label>
          <input
            id="mission-start-date"
            type="date"
            required
            value={values.startDate}
            onChange={(event) => update({ startDate: event.target.value })}
          />
        </div>

        <div className="mission-form__field">
          <label htmlFor="mission-end-date">Date de fin (optionnelle)</label>
          <input
            id="mission-end-date"
            type="date"
            value={values.endDate ?? ''}
            onChange={(event) => update({ endDate: event.target.value })}
          />
        </div>
      </div>

      <div className="mission-form__field">
        <label htmlFor="mission-description">Description</label>
        <textarea
          id="mission-description"
          rows={3}
          value={values.description}
          onChange={(event) => update({ description: event.target.value })}
        />
      </div>

      <div className="mission-form__actions">
        <Button type="submit" loading={submitting}>
          {mission === undefined ? 'Créer la mission' : 'Enregistrer les modifications'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
