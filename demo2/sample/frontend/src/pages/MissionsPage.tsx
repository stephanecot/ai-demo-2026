import { useState } from 'react'
import { AssigneePicker } from '../components/missions/AssigneePicker'
import { MissionFilters } from '../components/missions/MissionFilters'
import { MissionForm } from '../components/missions/MissionForm'
import { MissionTable } from '../components/missions/MissionTable'
import { Button, Card, EmptyState, ErrorBanner, Spinner } from '../components/ui'
import { useConsultants } from '../hooks/useConsultants'
import { useCurrentUser } from '../hooks/currentUserContext'
import { useMissions } from '../hooks/useMissions'
import type { Mission, MissionCreate, MissionFilters as MissionFiltersValue } from '../types/dto'

/** What the form panel is currently doing. `null` means the panel is closed. */
type Editing = { mode: 'create' } | { mode: 'edit'; mission: Mission } | null

/**
 * Mission catalogue (US-002). Routing and data live here; the components stay pure.
 *
 * The manager-only controls below are hidden for a consultant as a convenience. The
 * access control is the server's `require_manager` — see the 403 test in
 * `backend/tests/api/test_missions.py`.
 */
export function MissionsPage() {
  const { currentUser } = useCurrentUser()
  const [filters, setFilters] = useState<MissionFiltersValue>({})
  const {
    missions,
    status,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    assign,
    detach,
    close,
    clearActionError,
  } = useMissions(filters)
  const consultants = useConsultants()
  const [editing, setEditing] = useState<Editing>(null)
  const [managingAssigneesId, setManagingAssigneesId] = useState<number | null>(null)

  // The filter card is hidden for a consultant, so a filter left by a previous
  // profile (e.g. a manager's "Globex" filter) would otherwise be invisible and
  // impossible to clear once a different identity is selected. Adjusted during
  // render — the React-recommended way to reset state on a key change — rather
  // than through an effect, which would fire one render late.
  const identityId = currentUser === null ? null : currentUser.id
  const [resetForIdentity, setResetForIdentity] = useState(identityId)
  if (resetForIdentity !== identityId) {
    setResetForIdentity(identityId)
    setFilters({})
  }

  const canManage = currentUser?.role === 'MANAGER'
  // Derived during render rather than kept in state, so it always reflects the
  // freshest `missions` list — including right after an assign or a detach.
  const managingMission =
    managingAssigneesId === null ? null : (missions.find((m) => m.id === managingAssigneesId) ?? null)

  if (currentUser === null) {
    return (
      <div className="stack">
        <h1>Missions</h1>
        <EmptyState message="Choisissez un profil de démonstration pour consulter les missions." />
      </div>
    )
  }

  const openEditing = (next: Editing) => {
    clearActionError()
    setManagingAssigneesId(null)
    setEditing(next)
  }

  const openAssignees = (mission: Mission) => {
    clearActionError()
    setEditing(null)
    setManagingAssigneesId(mission.id)
  }

  const handleSubmit = (payload: MissionCreate) => {
    const done =
      editing?.mode === 'edit' ? update(editing.mission.id, payload) : create(payload)
    void done.then((succeeded) => {
      if (succeeded) {
        setEditing(null)
      }
    })
  }

  const handleClose = (mission: Mission) => {
    clearActionError()
    void close(mission.id)
  }

  const panelOpen = editing !== null || managingMission !== null

  return (
    <div className="stack">
      <h1>Missions</h1>
      <p className="text-muted">
        {canManage
          ? 'Créez les missions, affectez les consultants et clôturez celles qui sont terminées.'
          : 'Les missions sur lesquelles vous êtes affecté.'}
      </p>

      {editing !== null ? (
        <Card title={editing.mode === 'edit' ? 'Modifier la mission' : 'Nouvelle mission'}>
          <MissionForm
            mission={editing.mode === 'edit' ? editing.mission : undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              clearActionError()
              setEditing(null)
            }}
            submitting={saving}
            error={actionError}
          />
        </Card>
      ) : null}

      {managingMission !== null ? (
        <Card title={`Affecter des consultants — ${managingMission.label}`}>
          <AssigneePicker
            mission={managingMission}
            consultants={{
              data: consultants.consultants,
              status: consultants.status,
              error: consultants.error,
            }}
            onAssign={(userIds) => void assign(managingMission.id, userIds)}
            onDetach={(userId) => void detach(managingMission.id, userId)}
            onClose={() => {
              clearActionError()
              setManagingAssigneesId(null)
            }}
            busy={saving}
            error={actionError}
          />
        </Card>
      ) : null}

      {canManage ? (
        <Card title="Filtres">
          <MissionFilters
            value={filters}
            onChange={setFilters}
            consultants={consultants.consultants}
            consultantsStatus={consultants.status}
          />
        </Card>
      ) : null}

      <Card
        title="Catalogue"
        actions={
          canManage && editing === null ? (
            <Button onClick={() => openEditing({ mode: 'create' })}>Nouvelle mission</Button>
          ) : null
        }
      >
        {status === 'loading' ? <Spinner label="Chargement des missions…" /> : null}

        {status === 'error' ? (
          <ErrorBanner message={error ?? 'Missions indisponibles.'} onRetry={reload} />
        ) : null}

        {status === 'ready' && actionError !== null && !panelOpen ? (
          <ErrorBanner message={actionError} />
        ) : null}

        {status === 'ready' && missions.length === 0 ? (
          <EmptyState
            message={
              canManage
                ? 'Aucune mission ne correspond à ces filtres.'
                : 'Vous n’êtes affecté à aucune mission pour le moment.'
            }
          />
        ) : null}

        {status === 'ready' && missions.length > 0 ? (
          <MissionTable
            missions={missions}
            canManage={canManage}
            onEdit={(mission) => openEditing({ mode: 'edit', mission })}
            onManageAssignees={canManage ? openAssignees : undefined}
            onClose={canManage ? handleClose : undefined}
          />
        ) : null}
      </Card>
    </div>
  )
}
