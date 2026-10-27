import { z } from 'zod'
import type { BookingsApi } from '@/entities/booking/api/bookingsApi'
import { BOOKINGS_ENDPOINT, bookingDtoSchema } from '@/entities/booking/api/dto'
import { toDomain, toDto } from '@/entities/booking/api/mappers'
import { httpRequest, parseResponse } from '@/shared/api'

const bookingListSchema = z.array(bookingDtoSchema)

/** `BookingsApi` over HTTP. `baseUrl` is empty for same-origin requests (and for MSW). */
export function createHttpBookingsApi(baseUrl: string): BookingsApi {
  const bookingsUrl = `${baseUrl}${BOOKINGS_ENDPOINT}`

  function bookingUrl(id: string): string {
    return `${bookingsUrl}/${encodeURIComponent(id)}`
  }

  return {
    async list(date) {
      const query = new URLSearchParams({ date })
      const data = await httpRequest(`${bookingsUrl}?${query}`)
      return parseResponse(bookingListSchema, data).map(toDomain)
    },

    async create(draft) {
      const data = await httpRequest(bookingsUrl, { method: 'POST', body: toDto(draft) })
      return toDomain(parseResponse(bookingDtoSchema, data))
    },

    async update(id, draft) {
      const data = await httpRequest(bookingUrl(id), { method: 'PATCH', body: toDto(draft) })
      return toDomain(parseResponse(bookingDtoSchema, data))
    },

    async remove(id) {
      await httpRequest(bookingUrl(id), { method: 'DELETE' })
    },
  }
}
