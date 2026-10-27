import type { BookingError } from '@/domain'

/**
 * Wire format shared by the HTTP client and the mock server.
 *
 * GET    /api/bookings?date=YYYY-MM-DD  -> 200 Booking[]
 * POST   /api/bookings                  -> 201 Booking   | 400 | 409
 * PATCH  /api/bookings/:id              -> 200 Booking   | 400 | 404 | 409
 * DELETE /api/bookings/:id              -> 204           | 400 | 404
 */
export const BOOKINGS_PATH = '/api/bookings'

export type ApiErrorCode = 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: BookingError[]
  }
}
