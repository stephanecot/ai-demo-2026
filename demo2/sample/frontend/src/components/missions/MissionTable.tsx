import { formatDate } from '../../labels'
import type { Mission } from '../../types/dto'
import { Button } from '../ui'
import { MissionStatusBadge } from './MissionStatusBadge'
import './MissionTable.css'

type Props = {
  missions: Mission[]
  /** True for a manager. Hiding the controls is a convenience — the server is the guard. */
  canManage?: boolean
  onEdit?: (mission: Mission) => void
  onClose?: (mission: Mission) => void
  onManageAssignees?: (mission: Mission) => void
}

/** Presentational: props in, JSX out. No fetch, no router. */
export function MissionTable({
  missions,
  canManage = false,
  onEdit,
  onClose,
  onManageAssignees,
}: Props) {
  return (
    <div className="mission-table__scroll">
      <table className="mission-table">
        <caption className="mission-table__caption">
          Missions référencées ({missions.length})
        </caption>
        <thead>
          <tr>
            <th scope="col">Libellé</th>
            <th scope="col">Client</th>
            <th scope="col">Période</th>
            <th scope="col">Statut</th>
            <th scope="col">Consultants affectés</th>
            {canManage ? <th scope="col">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => (
            <tr key={mission.id}>
              <td>{mission.label}</td>
              <td>{mission.client}</td>
              <td>
                {`Du ${formatDate(mission.startDate)}`}
                {mission.endDate === null
                  ? ' (sans date de fin)'
                  : ` au ${formatDate(mission.endDate)}`}
              </td>
              <td>
                <MissionStatusBadge status={mission.status} />
              </td>
              <td>
                {mission.assignees.length === 0
                  ? 'Aucun'
                  : mission.assignees.map((user) => user.name).join(', ')}
              </td>
              {canManage ? (
                <td className="mission-table__actions">
                  {/* The mission name is in the accessible name but not on screen:
                      "Modifier" repeated down a column is unreadable, and a button whose
                      only label is "Modifier" is ambiguous to a screen reader. */}
                  <Button variant="secondary" onClick={() => onEdit?.(mission)}>
                    <>
                      Modifier<span className="visually-hidden"> {mission.label}</span>
                    </>
                  </Button>
                  <Button variant="secondary" onClick={() => onManageAssignees?.(mission)}>
                    <>
                      Affecter<span className="visually-hidden"> des consultants à {mission.label}</span>
                    </>
                  </Button>
                  {mission.status === 'ACTIVE' ? (
                    <Button variant="danger" onClick={() => onClose?.(mission)}>
                      <>
                        Clôturer<span className="visually-hidden"> {mission.label}</span>
                      </>
                    </Button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
