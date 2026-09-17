import type { ComponentPropsWithRef } from 'react'
import { FieldWrapper } from './FieldWrapper'
import { controlProps, type FieldBaseProps } from './fieldProps'

export type TextFieldProps = FieldBaseProps & Omit<ComponentPropsWithRef<'input'>, 'id'>

export function TextField({ id, label, error, hint, ...inputProps }: TextFieldProps) {
  const { errorId, hintId, ...control } = controlProps(id, error, hint)
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} errorId={errorId} hintId={hintId}>
      <input type="text" {...control} {...inputProps} />
    </FieldWrapper>
  )
}
