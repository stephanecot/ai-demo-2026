import type { ComponentPropsWithRef } from 'react'
import { buttonClassName, type ButtonVariant } from './buttonClassName'

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />
}
