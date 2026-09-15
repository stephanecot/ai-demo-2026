import type { ReactNode } from 'react'
import styles from './Field.module.css'

type Props = {
  id: string
  label: string
  error?: string
  hint?: string
  errorId: string
  hintId: string
  children: ReactNode
}

export function FieldWrapper({ id, label, error, hint, errorId, hintId, children }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
