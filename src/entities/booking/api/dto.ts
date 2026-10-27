import { z } from 'zod'
import { isRealDate, TIME_PATTERN } from '@/shared/lib/time'

/**
 * Wire format of the bookings endpoints. Unknown data is validated here, once;
 * everything past this boundary trusts its types.
 *
 * GET    /api/bookings?date=YYYY-MM-DD  -> 200 BookingDto[]
 * POST   /api/bookings                  -> 201 BookingDto  | 400 | 409
 * PATCH  /api/bookings/:id              -> 200 BookingDto  | 400 | 404 | 409
 * DELETE /api/bookings/:id              -> 204             | 400 | 404
 */
export const BOOKINGS_ENDPOINT = '/api/bookings'

function emptyToUndefined(text: string): string | undefined {
  if (text === '') return undefined
  return text
}

export const isoDateSchema = z.string().refine(isRealDate, 'Date must be YYYY-MM-DD')
const timeSchema = z.string().regex(TIME_PATTERN, 'Time must be HH:mm')
const titleSchema = z.string().trim().transform(emptyToUndefined).optional()

export const bookingDtoSchema = z.object({
  id: z.string(),
  date: isoDateSchema,
  start: timeSchema,
  end: timeSchema,
  title: titleSchema,
})

export const bookingDraftDtoSchema = bookingDtoSchema.omit({ id: true })

/** PATCH body: any subset of the draft fields. */
export const bookingPatchDtoSchema = bookingDraftDtoSchema.partial()

export type BookingDto = z.infer<typeof bookingDtoSchema>
export type BookingDraftDto = z.infer<typeof bookingDraftDtoSchema>

/** What the client sends (before the server trims the title). */
export type BookingDraftRequestDto = z.input<typeof bookingDraftDtoSchema>
