import { Link } from 'react-router-dom'
import { Card, EmptyState } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="stack">
      <h1>Page introuvable</h1>
      <Card>
        <EmptyState
          message="Cette page n’existe pas ou a été déplacée."
          action={<Link to="/">Revenir à l’accueil</Link>}
        />
      </Card>
    </div>
  )
}
