import type { IsoDate, Time } from '@/shared/lib/time'

export interface Booking {
  id: string
  date: IsoDate
  start: Time
  end: Time
  title?: string
}

/** What the user submits when creating or editing a booking. */
export type BookingDraft = Omit<Booking, 'id'>

export type BookingErrorCode =
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'OUTSIDE_WORKING_HOURS'
  | 'START_NOT_BEFORE_END'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'OVERLAP'
  | 'PAST_DATE'
  | 'PAST_TIME'
  | 'BOOKING_LOCKED'

export type BookingField = 'date' | 'start' | 'end'

export interface BookingError {
  code: BookingErrorCode
  field: BookingField
  message: string
  /** For `OVERLAP`: the booking that conflicts with the draft. */
  conflictWith?: Booking
}
