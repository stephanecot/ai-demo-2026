import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary'

/** Class list of a button, for links that must look like one (e.g. header CTA). */
export function buttonClassName(variant: ButtonVariant = 'primary', className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(' ')
}
