import type { BookingFormField } from '@/features/booking-form/model/schema'
import type { ApiErrorDetail } from '@/shared/api'

const formFieldByServerField: Record<string, BookingFormField | undefined> = {
  date: 'date',
  start: 'start',
  end: 'end',
  title: 'title',
}

export interface SplitServerErrors {
  fieldErrors: Partial<Record<BookingFormField, string>>
  /** Details that do not belong to a form field; shown above the form. */
  otherMessages: string[]
}

/** Puts each 400 detail under the form field it names, or into `otherMessages`. */
export function splitServerErrors(details: ApiErrorDetail[]): SplitServerErrors {
  const result: SplitServerErrors = { fieldErrors: {}, otherMessages: [] }
  for (const detail of details) {
    const field = formFieldByServerField[detail.field ?? '']
    if (!field) {
      result.otherMessages.push(detail.message)
      continue
    }
    result.fieldErrors[field] = detail.message
  }
  return result
}
