import type { ReactNode } from 'react'
import './Header.css'

type Props = {
  /** Current-user block — filled by US-001. */
  userSlot?: ReactNode
  /** Notification bell — filled by US-010. */
  notificationSlot?: ReactNode
}

export function Header({ userSlot, notificationSlot }: Props) {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <span className="header__logo" aria-hidden="true">
            CRA
          </span>
          <span className="header__title">Compte rendu d’activité</span>
        </div>
        <div className="header__aside">
          <div className="header__slot" data-slot="notifications">
            {notificationSlot}
          </div>
          <div className="header__slot" data-slot="user">
            {userSlot}
          </div>
        </div>
      </div>
    </header>
  )
}
