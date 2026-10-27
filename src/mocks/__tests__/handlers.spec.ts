// @vitest-environment node
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { ApiErrorBody } from '@/api/contract'
import type { Booking } from '@/domain'
import { createHandlers } from '../handlers'
import { createBookingStore, type BookingStore } from '../store'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'
const BASE = 'http://localhost/api/bookings'

const SEED: Booking[] = [
  { id: 'a', date: TOMORROW, start: '10:00', end: '11:00', title: 'Planning' },
  { id: 'b', date: TOMORROW, start: '14:00', end: '15:00' },
  { id: 'started', date: TODAY, start: '11:30', end: '12:30' },
]

let store: BookingStore
let simulateConflict = false

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  store = createBookingStore(SEED)
  simulateConflict = false
  server.resetHandlers(
    ...createHandlers({
      store,
      now: () => NOW,
      latency: [0, 0],
      shouldSimulateConflict: () => simulateConflict,
    }),
  )
})
afterEach(() => server.resetHandlers())

const send = (method: string, path = '', body?: unknown) =>
  fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const errorOf = async (res: Response) => ((await res.json()) as ApiErrorBody).error

describe('GET /api/bookings', () => {
  it('returns bookings for the date, sorted by start', async () => {
    store.insert({ date: TOMORROW, start: '09:00', end: '09:30' })
    const res = await send('GET', `?date=${TOMORROW}`)
    expect(res.status).toBe(200)
    const list = (await res.json()) as Booking[]
    expect(list.map((b) => b.start)).toEqual(['09:00', '10:00', '14:00'])
  })

  it('returns an empty list for a free day', async () => {
    const res = await send('GET', '?date=2026-11-02')
    expect(await res.json()).toEqual([])
  })

  it('rejects a missing or malformed date', async () => {
    expect((await send('GET')).status).toBe(400)
    expect((await send('GET', '?date=tomorrow')).status).toBe(400)
  })
})

describe('POST /api/bookings', () => {
  it('creates a booking', async () => {
    const res = await send('POST', '', {
      date: TOMORROW,
      start: '11:00',
      end: '12:00',
      title: ' Sync ',
    })
    expect(res.status).toBe(201)
    const created = (await res.json()) as Booking
    expect(created).toMatchObject({ date: TOMORROW, start: '11:00', end: '12:00', title: 'Sync' })
    expect(store.get(created.id)).toEqual(created)
  })

  it('drops an empty title', async () => {
    const res = await send('POST', '', {
      date: TOMORROW,
      start: '11:00',
      end: '12:00',
      title: '  ',
    })
    expect(((await res.json()) as Booking).title).toBeUndefined()
  })

  it('returns 400 with details for invalid data', async () => {
    const res = await send('POST', '', { date: TOMORROW, start: '17:00', end: '19:00' })
    expect(res.status).toBe(400)
    const error = await errorOf(res)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.details?.map((d) => d.code)).toEqual(['OUTSIDE_WORKING_HOURS'])
  })

  it('returns 400 for a non-object body', async () => {
    expect((await send('POST', '', [1, 2])).status).toBe(400)
    expect((await send('POST', '', 'oops')).status).toBe(400)
  })

  it('returns 409 for an overlap', async () => {
    const res = await send('POST', '', { date: TOMORROW, start: '10:30', end: '11:30' })
    expect(res.status).toBe(409)
    const error = await errorOf(res)
    expect(error.code).toBe('CONFLICT')
    expect(error.details?.[0]?.conflictWith?.id).toBe('a')
  })

  it('prefers 400 when the draft is both invalid and overlapping', async () => {
    const res = await send('POST', '', { date: TOMORROW, start: '10:00', end: '10:15' })
    expect(res.status).toBe(400)
  })

  it('allows touching an existing booking', async () => {
    const res = await send('POST', '', { date: TOMORROW, start: '11:00', end: '11:30' })
    expect(res.status).toBe(201)
  })
})

describe('PATCH /api/bookings/:id', () => {
  it('updates fields and keeps the rest', async () => {
    const res = await send('PATCH', '/a', { start: '10:30', end: '11:30' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ...SEED[0], start: '10:30', end: '11:30' })
  })

  it('accepts an unchanged time (does not conflict with itself)', async () => {
    const res = await send('PATCH', '/a', { title: 'Renamed' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as Booking).title).toBe('Renamed')
  })

  it('returns 409 when moved onto another booking', async () => {
    const res = await send('PATCH', '/a', { start: '13:30', end: '14:30' })
    expect(res.status).toBe(409)
    expect(store.get('a')?.start).toBe('10:00')
  })

  it('returns 404 for a missing id', async () => {
    expect((await send('PATCH', '/nope', { title: 'x' })).status).toBe(404)
  })

  it('refuses to edit a booking that has started', async () => {
    const res = await send('PATCH', '/started', { title: 'Late' })
    expect(res.status).toBe(400)
    expect((await errorOf(res)).details?.[0]?.code).toBe('BOOKING_LOCKED')
  })
})

describe('DELETE /api/bookings/:id', () => {
  it('deletes a booking', async () => {
    const res = await send('DELETE', '/a')
    expect(res.status).toBe(204)
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
    simulateConflict = true
    const res = await send('POST', '', { date: TOMORROW, start: '16:00', end: '17:00' })
    expect(res.status).toBe(409)
    const theirs = store.byDate(TOMORROW).find((b) => b.start === '16:00')
    expect(theirs?.title).toBe('Booked by someone else')
  })

  it('also applies to updates', async () => {
    simulateConflict = true
    const res = await send('PATCH', '/a', { start: '16:00', end: '17:00' })
    expect(res.status).toBe(409)
    expect(store.get('a')?.start).toBe('10:00')
  })

  it('does not insert anything for an invalid draft', async () => {
    simulateConflict = true
    const res = await send('POST', '', { date: TOMORROW, start: '16:00', end: '16:10' })
    expect(res.status).toBe(400)
    expect(store.byDate(TOMORROW)).toHaveLength(2)
  })
})
