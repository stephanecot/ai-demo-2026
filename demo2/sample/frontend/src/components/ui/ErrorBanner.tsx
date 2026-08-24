import { Button } from './Button'
import './ErrorBanner.css'

type Props = {
  /** The backend `detail`, already in French — displayed verbatim. */
  message: string
  onRetry?: () => void
}

/** Error state. `role="alert"` so the message is announced when it appears. */
export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__content">
        <span className="error-banner__icon" aria-hidden="true">
          !
        </span>
        <p className="error-banner__message">{message}</p>
      </div>
      {onRetry !== undefined ? (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  )
}
