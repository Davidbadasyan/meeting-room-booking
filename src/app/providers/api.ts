import type { Plugin } from 'vue'
import { BOOKINGS_API_KEY, createHttpBookingsApi } from '@/entities/booking'
import { API_BASE_URL } from '@/shared/config'

/**
 * Provides the BookingsApi to the whole app. Mock and http mode use the same
 * HTTP implementation: in mock mode the MSW worker answers the requests.
 */
export const apiProvider: Plugin = {
  install(app) {
    app.provide(BOOKINGS_API_KEY, createHttpBookingsApi(API_BASE_URL))
  },
}
