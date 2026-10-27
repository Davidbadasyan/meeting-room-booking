import { inject } from 'vue'
import { BOOKINGS_API_KEY, type BookingsApi } from '@/entities/booking/api/bookingsApi'

/** The `BookingsApi` provided by `app/providers/api.ts`. */
export function useBookingsApi(): BookingsApi {
  const api = inject(BOOKINGS_API_KEY)
  if (!api) throw new Error('BookingsApi is not provided. Install the api provider in main.ts.')

  return api
}
