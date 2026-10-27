// @vitest-environment node
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Booking } from '@/entities/booking'
import type { ApiErrorBody } from '@/shared/api'
import { createHandlers } from '@/mocks/handlers'
import { createBookingStore, type BookingStore } from '@/mocks/store'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'
const BASE_URL = 'http://localhost/api/bookings'

const SEED: Booking[] = [
  { id: 'a', date: TOMORROW, start: '10:00', end: '11:00', title: 'Planning' },
  { id: 'b', date: TOMORROW, start: '14:00', end: '15:00' },
  { id: 'started', date: TODAY, start: '11:30', end: '12:30' },
]

let store: BookingStore
let isConflictSimulated = false
let isListFailureSimulated = false

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  store = createBookingStore(SEED)
  isConflictSimulated = false
  isListFailureSimulated = false
  server.resetHandlers(
    ...createHandlers({
      store,
      now: () => NOW,
      latency: [0, 0],
      shouldSimulateConflict: () => isConflictSimulated,
      shouldSimulateListFailure: () => isListFailureSimulated,
    }),
  )
})

function send(method: string, path = '', body?: unknown) {
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readError(response: Response) {
  const body: ApiErrorBody = await response.json()
  return body.error
}

async function readBooking(response: Response) {
  const booking: Booking = await response.json()
  return booking
}

describe('GET /api/bookings', () => {
  it('returns bookings for the date, sorted by start', async () => {
    store.insert({ date: TOMORROW, start: '09:00', end: '09:30' })
    const response = await fetch(`${BASE_URL}?date=${TOMORROW}`)
    expect(response.status).toBe(200)
    const bookings: Booking[] = await response.json()
    expect(bookings.map((booking) => booking.start)).toEqual(['09:00', '10:00', '14:00'])
  })

  it('returns an empty list for a free day', async () => {
    const response = await fetch(`${BASE_URL}?date=2026-11-02`)
    expect(await response.json()).toEqual([])
  })

  it('rejects a missing or malformed date', async () => {
    expect((await fetch(BASE_URL)).status).toBe(400)
    expect((await fetch(`${BASE_URL}?date=tomorrow`)).status).toBe(400)
  })
})

describe('POST /api/bookings', () => {
  it('creates a booking with a trimmed title', async () => {
    const response = await send('POST', '', {
      date: TOMORROW,
      start: '11:00',
      end: '12:00',
      title: ' Sync ',
    })
    expect(response.status).toBe(201)
    const created = await readBooking(response)
    expect(created).toMatchObject({ date: TOMORROW, start: '11:00', end: '12:00', title: 'Sync' })
    expect(store.get(created.id)).toEqual(created)
  })

  it('rejects a title longer than 100 characters', async () => {
    const response = await send('POST', '', {
      date: TOMORROW,
      start: '11:00',
      end: '12:00',
      title: 'x'.repeat(101),
    })
    expect(response.status).toBe(400)
    expect((await readError(response)).details?.[0]?.field).toBe('title')
  })

  it('drops an empty title', async () => {
    const response = await send('POST', '', {
      date: TOMORROW,
      start: '11:00',
      end: '12:00',
      title: ' ',
    })
    expect((await readBooking(response)).title).toBeUndefined()
  })

  it('returns 400 with rule details for invalid data', async () => {
    const response = await send('POST', '', { date: TOMORROW, start: '17:00', end: '19:00' })
    expect(response.status).toBe(400)
    const error = await readError(response)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.details?.map((detail) => detail.code)).toEqual(['OUTSIDE_WORKING_HOURS'])
  })

  it('returns 400 with format details for malformed fields', async () => {
    const response = await send('POST', '', { date: '2026-02-30', start: '9am', end: '11:00' })
    expect(response.status).toBe(400)
    const error = await readError(response)
    expect(error.details?.map((detail) => detail.field)).toEqual(['date', 'start'])
  })

  it('returns 400 for a body that is not a booking', async () => {
    expect((await send('POST', '', [1, 2])).status).toBe(400)
    expect((await send('POST')).status).toBe(400)
  })

  it('returns 409 for an overlap', async () => {
    const response = await send('POST', '', { date: TOMORROW, start: '10:30', end: '11:30' })
    expect(response.status).toBe(409)
    const error = await readError(response)
    expect(error.code).toBe('CONFLICT')
    expect(error.details?.map((detail) => detail.code)).toEqual(['OVERLAP'])
  })

  it('prefers 400 when the draft is both invalid and overlapping', async () => {
    const response = await send('POST', '', { date: TOMORROW, start: '10:00', end: '10:15' })
    expect(response.status).toBe(400)
  })

  it('allows touching an existing booking', async () => {
    const response = await send('POST', '', { date: TOMORROW, start: '11:00', end: '11:30' })
    expect(response.status).toBe(201)
  })
})

describe('PATCH /api/bookings/:id', () => {
  it('updates the given fields and keeps the rest', async () => {
    const response = await send('PATCH', '/a', { start: '10:30', end: '11:30' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ...SEED[0], start: '10:30', end: '11:30' })
  })

  it('accepts an unchanged time (does not conflict with itself)', async () => {
    const response = await send('PATCH', '/a', { title: 'Renamed' })
    expect(response.status).toBe(200)
    expect((await readBooking(response)).title).toBe('Renamed')
  })

  it('clears the title when it is sent empty', async () => {
    const response = await send('PATCH', '/a', { title: '' })
    expect((await readBooking(response)).title).toBeUndefined()
  })

  it('returns 409 when moved onto another booking', async () => {
    const response = await send('PATCH', '/a', { start: '13:30', end: '14:30' })
    expect(response.status).toBe(409)
    expect(store.get('a')?.start).toBe('10:00')
  })

  it('returns 404 for a missing id', async () => {
    expect((await send('PATCH', '/nope', { title: 'x' })).status).toBe(404)
  })

  it('refuses to edit a booking that has started', async () => {
    const response = await send('PATCH', '/started', { title: 'Late' })
    expect(response.status).toBe(400)
    const error = await readError(response)
    expect(error.details?.[0]?.code).toBe('ALREADY_STARTED')
  })
})

describe('DELETE /api/bookings/:id', () => {
  it('deletes a booking', async () => {
    const response = await send('DELETE', '/a')
    expect(response.status).toBe(204)
    expect(store.get('a')).toBeUndefined()
  })

  it('returns 404 for a missing id', async () => {
    expect((await send('DELETE', '/nope')).status).toBe(404)
  })

  it('refuses to delete a booking that has started', async () => {
    expect((await send('DELETE', '/started')).status).toBe(400)
    expect(store.get('started')).toBeDefined()
  })
})

describe('conflict simulation', () => {
  it('inserts a competing booking and returns 409 for a valid create', async () => {
    isConflictSimulated = true
    const response = await send('POST', '', { date: TOMORROW, start: '16:00', end: '17:00' })
    expect(response.status).toBe(409)
    const competing = store.byDate(TOMORROW).find((booking) => booking.start === '16:00')
    expect(competing?.title).toBe('Booked by someone else')
  })

  it('also applies to updates', async () => {
    isConflictSimulated = true
    const response = await send('PATCH', '/a', { start: '16:00', end: '17:00' })
    expect(response.status).toBe(409)
    expect(store.get('a')?.start).toBe('10:00')
  })

  it('does not insert anything for an invalid draft', async () => {
    isConflictSimulated = true
    const response = await send('POST', '', { date: TOMORROW, start: '16:00', end: '16:10' })
    expect(response.status).toBe(400)
    expect(store.byDate(TOMORROW)).toHaveLength(2)
  })
})

describe('server error simulation', () => {
  it('fails the list request with 500', async () => {
    isListFailureSimulated = true
    const response = await fetch(`${BASE_URL}?date=${TOMORROW}`)
    expect(response.status).toBe(500)
    expect((await readError(response)).code).toBe('SERVER_ERROR')
  })
})
