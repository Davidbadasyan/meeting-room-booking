import { z } from 'zod'
import {
  TITLE_MAX_LENGTH,
  validateBooking,
  type Booking,
  type BookingDraft,
} from '@/entities/booking'
import { fieldFormatMessages } from '@/features/booking-form/config/messages'
import { isRealDate, TIME_PATTERN, type IsoDate } from '@/shared/lib/time'

export interface BookingFormValues {
  date: IsoDate
  start: string
  end: string
  title: string
}

export type BookingFormField = keyof BookingFormValues

/** What the business rules need besides the form values. */
export interface BookingRuleContext {
  existing: readonly Booking[]
  now: Date
  editingId?: string
}

const formatSchema = z.object({
  date: z.string().refine(isRealDate, fieldFormatMessages.date),
  start: z.string().regex(TIME_PATTERN, fieldFormatMessages.start),
  end: z.string().regex(TIME_PATTERN, fieldFormatMessages.end),
  title: z.string().trim().max(TITLE_MAX_LENGTH, fieldFormatMessages.title),
})

/**
 * Format checks first, then the same `validateBooking` rules the server runs.
 * `pipe` runs the rules only once every field has the right format.
 */
export function createBookingFormSchema(context: BookingRuleContext) {
  const rulesSchema = formatSchema.superRefine((values, issues) => {
    addRuleIssues(values, context, issues)
  })
  return formatSchema.pipe(rulesSchema)
}

function addRuleIssues(
  values: BookingFormValues,
  context: BookingRuleContext,
  issues: z.RefinementCtx,
) {
  const errors = validateBooking(values, context.existing, context.now, context.editingId)
  for (const error of errors) {
    issues.addIssue({ code: z.ZodIssueCode.custom, path: [error.field], message: error.message })
  }
}

/** Values for an edited booking, or an empty form on `date` (optionally with a chosen start). */
export function toFormValues(date: IsoDate, booking?: Booking, start = ''): BookingFormValues {
  if (!booking) return { date, start, end: '', title: '' }

  return { date: booking.date, start: booking.start, end: booking.end, title: booking.title ?? '' }
}

export function toDraft(values: BookingFormValues): BookingDraft {
  return { date: values.date, start: values.start, end: values.end, title: values.title }
}
