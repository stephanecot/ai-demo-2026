import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Mission, UserSummary } from '../../types/dto'
import type { RemoteStatus } from '../../hooks/useMissions'
import { Button, EmptyState, ErrorBanner, Spinner } from '../ui'
import './AssigneePicker.css'

/** The consultant pool this picker offers, with its own remote state. */
export type ConsultantsState = {
  data: UserSummary[]
  status: RemoteStatus
  error: string | null
}

type Props = {
  mission: Mission
  consultants: ConsultantsState
  onAssign: (userIds: number[]) => void
  onDetach: (userId: number) => void
  onClose: () => void
  busy?: boolean
  /** Backend `detail` of the last assignment action, already French — shown verbatim. */
  error?: string | null
}

/**
 * Attach or detach consultants on one mission (US-002, US2). Presentational: props in,
 * JSX out, the page owns the API calls through `useMissions`.
 */
export function AssigneePicker({
  mission,
  consultants,
  onAssign,
  onDetach,
  onClose,
  busy = false,
  error,
}: Props) {
  const [selected, setSelected] = useState<number[]>([])

  const candidates = consultants.data.filter(
    (consultant) => !mission.assignees.some((assignee) => assignee.id === consultant.id),
  )

  const toggle = (userId: number) => {
    setSelected((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selected.length === 0) {
      return
    }
    onAssign(selected)
    setSelected([])
  }

  return (
    <div className="assignee-picker">
      {error === null || error === undefined ? null : <ErrorBanner message={error} />}

      <div className="assignee-picker__section">
        <h3>Consultants affectés</h3>
        {mission.assignees.length === 0 ? (
          <p className="text-muted">Aucun consultant affecté pour le moment.</p>
        ) : (
          <ul className="assignee-picker__list">
            {mission.assignees.map((assignee) => (
              <li key={assignee.id} className="assignee-picker__item">
                <span>{assignee.name}</span>
                <Button variant="secondary" disabled={busy} onClick={() => onDetach(assignee.id)}>
                  <>
                    Détacher<span className="visually-hidden"> {assignee.name}</span>
                  </>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="assignee-picker__section">
        <h3>Ajouter des consultants</h3>

        {consultants.status === 'loading' ? (
          <Spinner label="Chargement des consultants…" />
        ) : null}

        {consultants.status === 'error' ? (
          <ErrorBanner message={consultants.error ?? 'Consultants indisponibles.'} />
        ) : null}

        {consultants.status === 'ready' && consultants.data.length === 0 ? (
          <EmptyState message="Aucun consultant n’existe dans le système." />
        ) : null}

        {consultants.status === 'ready' && consultants.data.length > 0 && candidates.length === 0 ? (
          <EmptyState message="Tous les consultants disponibles sont déjà affectés à cette mission." />
        ) : null}

        {consultants.status === 'ready' && candidates.length > 0 ? (
          <form className="assignee-picker__form" onSubmit={handleSubmit}>
            <fieldset className="assignee-picker__fieldset">
              <legend className="visually-hidden">Consultants à affecter</legend>
              {candidates.map((candidate) => (
                <label key={candidate.id} className="assignee-picker__option">
                  <input
                    type="checkbox"
                    checked={selected.includes(candidate.id)}
                    onChange={() => toggle(candidate.id)}
                  />
                  {candidate.name}
                </label>
              ))}
            </fieldset>
            <Button type="submit" loading={busy} disabled={selected.length === 0}>
              Affecter
            </Button>
          </form>
        ) : null}
      </div>

      <div className="assignee-picker__actions">
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  )
}
