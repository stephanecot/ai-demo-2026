import type { ReactNode } from 'react'
import './Card.css'

type Props = {
  children: ReactNode
  title?: string
  actions?: ReactNode
}

/** White surface with the standard radius and shadow; header shown only when titled. */
export function Card({ children, title, actions }: Props) {
  return (
    <section className="card">
      {title !== undefined || actions !== undefined ? (
        <header className="card__header">
          {title !== undefined ? <h2 className="card__title">{title}</h2> : null}
          {actions !== undefined ? <div className="card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  )
}
