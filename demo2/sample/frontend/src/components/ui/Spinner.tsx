import './Spinner.css'

type Props = {
  /** French sentence, e.g. « Chargement des missions… ». Announced and displayed. */
  label: string
}

/** Loading state. `role="status"` so screen readers announce the wait. */
export function Spinner({ label }: Props) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__disc" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  )
}
