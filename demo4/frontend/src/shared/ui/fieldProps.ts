import styles from './Field.module.css'

export type FieldBaseProps = {
  id: string
  label: string
  error?: string
  hint?: string
}

/** Shared a11y wiring for TextField / TextArea / Select: label, error message, aria-* links. */
export function controlProps(id: string, error: string | undefined, hint: string | undefined) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')
  return {
    id,
    className: error ? `${styles.control} ${styles.invalid}` : styles.control,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    errorId,
    hintId,
  }
}
