import { Card, ErrorBanner, Spinner } from '../components/ui'
import { useHealth } from '../hooks/useHealth'
import { formatDateTime } from '../labels'
import type { Health } from '../types/dto'
import './HomePage.css'

const DATABASE_LABELS: Record<Health['database'], string> = {
  ok: 'Disponible',
  ko: 'Indisponible',
}

/** Shell page: proves the tree, the proxy, the header plumbing and the error shape. */
export function HomePage() {
  const { health, status, error, reload } = useHealth()

  return (
    <div className="stack">
      <h1>Tableau de bord</h1>
      <p className="text-muted">
        Le socle de l’application est en place. Les écrans métier arriveront avec les
        prochaines fonctionnalités.
      </p>

      <Card title="État de l’API">
        {status === 'loading' ? <Spinner label="Chargement…" /> : null}

        {status === 'error' ? (
          <div className="stack stack--tight">
            <p className="home__headline home__headline--error">API indisponible</p>
            <ErrorBanner message={error ?? 'API indisponible.'} onRetry={reload} />
          </div>
        ) : null}

        {status === 'ready' && health !== null ? (
          <div className="stack stack--tight">
            <p
              className={
                health.status === 'ok'
                  ? 'home__headline home__headline--ok'
                  : 'home__headline home__headline--degraded'
              }
            >
              {health.status === 'ok'
                ? `API disponible — version ${health.version}`
                : `API dégradée — version ${health.version}`}
            </p>
            <dl className="home__facts">
              <div className="home__fact">
                <dt>Base de données</dt>
                <dd>{DATABASE_LABELS[health.database]}</dd>
              </div>
              <div className="home__fact">
                <dt>Dernière vérification</dt>
                <dd>{formatDateTime(health.time)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
