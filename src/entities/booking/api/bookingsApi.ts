import type { InjectionKey } from 'vue'
import type { Booking, BookingDraft } from '@/entities/booking/model/booking'
import type { IsoDate } from '@/shared/lib/time'

/**
 * Everything the UI needs from the backend. The UI depends only on this
 * interface, so swapping the backend means writing one new implementation.
 *
 * Methods throw the typed errors from `@/shared/api` (ConflictError, ...).
 */
export interface BookingsApi {
  list(date: IsoDate): Promise<Booking[]>
  create(draft: BookingDraft): Promise<Booking>
  update(id: string, draft: BookingDraft): Promise<Booking>
  remove(id: string): Promise<void>
}

export const BOOKINGS_API_KEY: InjectionKey<BookingsApi> = Symbol('BookingsApi')
