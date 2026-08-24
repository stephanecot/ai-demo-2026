import { CRA_STATUS_LABELS } from '../../labels'
import type { CraStatus } from '../../types/dto'
import './StatusBadge.css'

type Props = {
  status: CraStatus
}

const MODIFIERS: Record<CraStatus, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

/** Colour AND French label — the status is never conveyed by colour alone. */
export function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge status-badge--${MODIFIERS[status]}`}>
      {CRA_STATUS_LABELS[status]}
    </span>
  )
}
