import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, inject, toValue, type MaybeRefOrGetter } from 'vue'
import { BOOKINGS_API_KEY, type BookingsApi } from '@/entities/booking/api/bookingsApi'
import { ConflictError, NotFoundError } from '@/shared/api'
import type { IsoDate } from '@/shared/lib/time'

const BOOKINGS_QUERY_KEY = 'bookings'

/** Every bookings query; invalidating this refreshes all dates. */
export const allBookingsKey = [BOOKINGS_QUERY_KEY]

export function bookingsByDateKey(date: IsoDate) {
  return [BOOKINGS_QUERY_KEY, date]
}

/** The `BookingsApi` provided by `app/providers/api.ts`. */
export function useBookingsApi(): BookingsApi {
  const api = inject(BOOKINGS_API_KEY)
  if (!api) throw new Error('BookingsApi is not provided. Install the api provider in main.ts.')

  return api
}

/** Bookings for one date. Refetches automatically when `date` changes. */
export function useBookingsQuery(date: MaybeRefOrGetter<IsoDate>) {
  const api = useBookingsApi()
  return useQuery({
    queryKey: computed(() => bookingsByDateKey(toValue(date))),
    queryFn: () => api.list(toValue(date)),
  })
}

/** A 409 or 404 means our copy of the list is out of date. */
function isStaleListError(error: Error): boolean {
  if (error instanceof ConflictError) return true
  return error instanceof NotFoundError
}

/** Refreshes the cached booking lists after a write, so every view shows the server's state. */
export function useRefreshBookings() {
  const queryClient = useQueryClient()

  function refreshBookings(): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: allBookingsKey })
  }

  async function refreshBookingsIfStale(error: Error): Promise<void> {
    if (!isStaleListError(error)) return
    await refreshBookings()
  }

  return { refreshBookings, refreshBookingsIfStale }
}
