import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { bookingsByDateKey, useBookingsQuery, type Booking } from '@/entities/booking'
import { useDeleteBooking } from '@/features/delete-booking/api/useDeleteBooking'
import { mountComposable, startTestBackend } from '@/mocks/testing'
import { ValidationError } from '@/shared/api'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'

const PLANNING: Booking = { id: 'a', date: TOMORROW, start: '10:00', end: '11:00' }
const STARTED: Booking = { id: 'started', date: TODAY, start: '11:30', end: '12:30' }

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let unmount = () => {}
afterEach(() => unmount())

function mountDelete() {
  const mounted = mountComposable(() => {
    useBookingsQuery(TOMORROW)
    return useDeleteBooking()
  }, NOW)
  unmount = mounted.unmount
  return mounted
}

function cachedBookings(queryClient: ReturnType<typeof mountDelete>['queryClient']) {
  const bookings: Booking[] | undefined = queryClient.getQueryData(bookingsByDateKey(TOMORROW))
  return bookings ?? []
}

describe('useDeleteBooking', () => {
  it('deletes the booking and refreshes the list', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: deleteBooking, queryClient } = mountDelete()
    await vi.waitFor(() => expect(cachedBookings(queryClient)).toHaveLength(1))

    expect(await deleteBooking.mutateAsync(PLANNING.id)).toBe('deleted')
    expect(backend.store.get(PLANNING.id)).toBeUndefined()
    expect(cachedBookings(queryClient)).toEqual([])
  })

  it('treats a booking deleted elsewhere (404) as already deleted and refreshes', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: deleteBooking, queryClient } = mountDelete()
    await vi.waitFor(() => expect(cachedBookings(queryClient)).toHaveLength(1))
    backend.store.remove(PLANNING.id)

    expect(await deleteBooking.mutateAsync(PLANNING.id)).toBe('alreadyDeleted')
    expect(cachedBookings(queryClient)).toEqual([])
  })

  it('rejects other errors, like a booking that has already started', async () => {
    startTestBackend(server, [STARTED], NOW)
    const { result: deleteBooking } = mountDelete()

    await expect(deleteBooking.mutateAsync(STARTED.id)).rejects.toBeInstanceOf(ValidationError)
  })
})
