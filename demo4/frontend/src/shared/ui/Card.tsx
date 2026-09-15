import type { ComponentPropsWithRef } from 'react'
import styles from './Card.module.css'

export function Card({ className, ...props }: ComponentPropsWithRef<'section'>) {
  return <section className={[styles.card, className].filter(Boolean).join(' ')} {...props} />
}
