export type { Booking, BookingDraft, BookingError } from '@/entities/booking/model/booking'
export { createBookingError, hasStarted, validateBooking } from '@/entities/booking/model/rules'
export {
  MAX_DURATION,
  MIN_DURATION,
  SLOT_STEP,
  WORK_END,
  WORK_START,
} from '@/entities/booking/config/workingHours'
export { TITLE_MAX_LENGTH } from '@/entities/booking/config/title'
export {
  BOOKINGS_ENDPOINT,
  bookingDraftDtoSchema,
  bookingDtoSchema,
  bookingPatchDtoSchema,
  isoDateSchema,
} from '@/entities/booking/api/dto'
// BookingsApi is the contract a real backend implements (see README: switching to a real API).
export { BOOKINGS_API_KEY, type BookingsApi } from '@/entities/booking/api/bookingsApi'
export { createHttpBookingsApi } from '@/entities/booking/api/httpBookingsApi'
export {
  bookingsByDateKey,
  useBookingsApi,
  useBookingsQuery,
  useRefreshBookings,
} from '@/entities/booking/api/queries'
export { describeBooking, displayTitle, formatTimeRange } from '@/entities/booking/lib/format'
export { default as BookingCard } from '@/entities/booking/ui/BookingCard.vue'
