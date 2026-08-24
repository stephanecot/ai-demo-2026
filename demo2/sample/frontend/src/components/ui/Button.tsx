import type { ReactNode } from 'react'
import './Button.css'

type Props = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
}

/** Stays disabled and shows a spinner while `loading`. */
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={onClick}
    >
      {loading ? <span className="button__spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  )
}
