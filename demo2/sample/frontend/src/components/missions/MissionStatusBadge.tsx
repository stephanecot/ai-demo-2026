import { MISSION_STATUS_LABELS } from '../../labels'
import type { MissionStatus } from '../../types/dto'
import './MissionStatusBadge.css'

type Props = {
  status: MissionStatus
}

/**
 * Status of a mission. Deliberately separate from `ui/StatusBadge`, which is typed on
 * `CraStatus`: widening a shared design-system component for one story would make every
 * other story live with the union.
 *
 * The status is carried by the text, never by the colour alone.
 */
export function MissionStatusBadge({ status }: Props) {
  return (
    <span className={`mission-status mission-status--${status.toLowerCase()}`}>
      {MISSION_STATUS_LABELS[status]}
    </span>
  )
}
