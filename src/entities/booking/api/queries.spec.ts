import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useBookingsQuery, useRefreshBookings } from '@/entities/booking/api/queries'
import type { Booking } from '@/entities/booking/model/booking'
import { mountComposable, startTestBackend } from '@/mocks/testing'
import { ConflictError, ValidationError } from '@/shared/api'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TOMORROW = '2026-10-28'
const DAY_AFTER = '2026-10-29'

const PLANNING: Booking = { id: 'a', date: TOMORROW, start: '10:00', end: '11:00' }
const REVIEW: Booking = { id: 'b', date: DAY_AFTER, start: '14:00', end: '15:00' }

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let unmount = () => {}
afterEach(() => unmount())

function mountBookings(date = ref(TOMORROW)) {
  const mounted = mountComposable(
    () => {
      const query = useBookingsQuery(date)
      return { query, ...useRefreshBookings() }
    },
    () => NOW,
  )
  unmount = mounted.unmount
  return mounted.result
}

describe('useBookingsQuery', () => {
  it('loads the bookings for the date', async () => {
    startTestBackend(server, [PLANNING, REVIEW], NOW)
    const { query } = mountBookings()

    expect(query.isPending.value).toBe(true)
    await vi.waitFor(() => expect(query.data.value).toEqual([PLANNING]))
  })

  it('loads again when the date changes', async () => {
    startTestBackend(server, [PLANNING, REVIEW], NOW)
    const date = ref(TOMORROW)
    const { query } = mountBookings(date)
    await vi.waitFor(() => expect(query.data.value).toEqual([PLANNING]))

    date.value = DAY_AFTER
    await vi.waitFor(() => expect(query.data.value).toEqual([REVIEW]))
  })

  it('retries a server error once, then shows the error', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    backend.simulateListFailure()
    const { query } = mountBookings()

    await vi.waitFor(() => expect(query.isError.value).toBe(true))
    expect(query.failureCount.value).toBe(2)
  })
})

describe('useRefreshBookings', () => {
  it('refreshes the list after a conflict', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { query, refreshBookingsIfStale } = mountBookings()
    await vi.waitFor(() => expect(query.data.value).toHaveLength(1))

    backend.store.insert({ date: TOMORROW, start: '12:00', end: '13:00' })
    await refreshBookingsIfStale(new ConflictError('Taken'))
    expect(query.data.value).toHaveLength(2)
  })

  it('leaves the list alone after a validation error', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { query, refreshBookingsIfStale } = mountBookings()
    await vi.waitFor(() => expect(query.data.value).toHaveLength(1))

    backend.store.insert({ date: TOMORROW, start: '12:00', end: '13:00' })
    await refreshBookingsIfStale(new ValidationError('Bad'))
    expect(query.data.value).toHaveLength(1)
  })
})
