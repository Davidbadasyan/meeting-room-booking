/**
 * Wire format of the bookings endpoints.
 *
 * GET    /api/bookings?date=YYYY-MM-DD  -> 200 BookingDto[]
 * POST   /api/bookings                  -> 201 BookingDto  | 400 | 409
 * PATCH  /api/bookings/:id              -> 200 BookingDto  | 400 | 404 | 409
 * DELETE /api/bookings/:id              -> 204             | 400 | 404
 *
 * Errors use `ApiErrorBody` from `@/shared/api` with `BookingError` details.
 */
export const BOOKINGS_ENDPOINT = '/api/bookings'

export interface BookingDto {
  id: string
  date: string
  start: string
  end: string
  title?: string
}
