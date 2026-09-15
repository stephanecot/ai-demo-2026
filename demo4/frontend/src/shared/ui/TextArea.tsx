import type { ComponentPropsWithRef } from 'react'
import { FieldWrapper } from './FieldWrapper'
import { controlProps, type FieldBaseProps } from './fieldProps'

export type TextAreaProps = FieldBaseProps & Omit<ComponentPropsWithRef<'textarea'>, 'id'>

export function TextArea({ id, label, error, hint, ...textareaProps }: TextAreaProps) {
  const { errorId, hintId, ...control } = controlProps(id, error, hint)
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} errorId={errorId} hintId={hintId}>
      <textarea {...control} {...textareaProps} />
    </FieldWrapper>
  )
}
