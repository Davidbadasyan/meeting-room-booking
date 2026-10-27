/** One choice in a `BaseSelect`; `Value` keeps the selected value typed (e.g. `Time`). */
export interface SelectOption<Value extends string = string> {
  value: Value
  label: string
  isDisabled?: boolean
}
