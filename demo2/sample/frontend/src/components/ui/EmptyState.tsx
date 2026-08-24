import type { ReactNode } from 'react'
import './EmptyState.css'

type Props = {
  /** French sentence explaining why the screen is empty. */
  message: string
  /** Optional call to action, e.g. a « Créer une mission » button. */
  action?: ReactNode
}

/** Empty state — an empty screen without a message reads as a bug during a demo. */
export function EmptyState({ message, action }: Props) {
  return (
    <div className="empty-state">
      <p className="empty-state__message">{message}</p>
      {action !== undefined ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
