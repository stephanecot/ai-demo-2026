import type { ComponentPropsWithRef } from 'react'
import { FieldWrapper } from './FieldWrapper'
import { controlProps, type FieldBaseProps } from './fieldProps'

export type SelectOption = { value: string; label: string }

export type SelectProps = FieldBaseProps &
  Omit<ComponentPropsWithRef<'select'>, 'id'> & {
    options: SelectOption[]
    placeholder?: string
  }

export function Select({ id, label, error, hint, options, placeholder, ...selectProps }: SelectProps) {
  const { errorId, hintId, ...control } = controlProps(id, error, hint)
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} errorId={errorId} hintId={hintId}>
      <select {...control} {...selectProps}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
