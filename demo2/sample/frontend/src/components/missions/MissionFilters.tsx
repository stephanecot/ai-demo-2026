import { MISSION_STATUS_LABELS } from '../../labels'
import type { MissionFilters as MissionFiltersValue, MissionStatus, UserSummary } from '../../types/dto'
import type { RemoteStatus } from '../../hooks/useMissions'
import './MissionFilters.css'

const STATUSES: MissionStatus[] = ['ACTIVE', 'CLOSED']

type Props = {
  value: MissionFiltersValue
  onChange: (value: MissionFiltersValue) => void
  consultants: UserSummary[]
  consultantsStatus: RemoteStatus
}

/**
 * Manager-only catalogue filters (US-002, US5). Presentational: it only reports the
 * next `MissionFilters` value — the page forwards it to the server through
 * `useMissions(filters)`, it is never applied client-side.
 */
export function MissionFilters({ value, onChange, consultants, consultantsStatus }: Props) {
  return (
    <div className="mission-filters">
      <div className="mission-filters__field">
        <label htmlFor="mission-filter-client">Client</label>
        <input
          id="mission-filter-client"
          value={value.client ?? ''}
          placeholder="Tous les clients"
          onChange={(event) => {
            const client = event.target.value
            onChange({ ...value, client: client === '' ? undefined : client })
          }}
        />
      </div>

      <div className="mission-filters__field">
        <label htmlFor="mission-filter-status">Statut</label>
        <select
          id="mission-filter-status"
          value={value.status ?? ''}
          onChange={(event) => {
            const status = event.target.value
            onChange({
              ...value,
              status: status === '' ? undefined : (status as MissionStatus),
            })
          }}
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {MISSION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="mission-filters__field">
        <label htmlFor="mission-filter-consultant">Consultant</label>
        <select
          id="mission-filter-consultant"
          value={value.userId ?? ''}
          disabled={consultantsStatus !== 'ready' || consultants.length === 0}
          onChange={(event) => {
            const userId = event.target.value
            onChange({ ...value, userId: userId === '' ? undefined : Number(userId) })
          }}
        >
          <option value="">Tous les consultants</option>
          {consultants.map((consultant) => (
            <option key={consultant.id} value={consultant.id}>
              {consultant.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
