// @vitest-environment node
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createHttpBookingsApi } from '@/entities/booking/api/httpBookingsApi'
import type { Booking } from '@/entities/booking/model/booking'
import { createHandlers } from '@/mocks/handlers'
import { createBookingStore } from '@/mocks/store'
import {
  ConflictError,
  NetworkError,
  NotFoundError,
  ServerError,
  ValidationError,
} from '@/shared/api'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TOMORROW = '2026-10-28'
const BASE_URL = 'http://localhost'
const BOOKINGS_URL = `${BASE_URL}/api/bookings`

const PLANNING: Booking = {
  id: 'a',
  date: TOMORROW,
  start: '10:00',
  end: '11:00',
  title: 'Planning',
}

const api = createHttpBookingsApi(BASE_URL)
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

function respondWith(status: number, body: JsonBodyType) {
  server.use(http.all(`${BOOKINGS_URL}*`, () => HttpResponse.json(body, { status })))
}

describe('against the mock server', () => {
  beforeEach(() => {
    const store = createBookingStore([PLANNING])
    const handlers = createHandlers({
      store,
      now: () => NOW,
      latency: [0, 0],
      shouldSimulateConflict: () => false,
      shouldSimulateListFailure: () => false,
    })
    server.resetHandlers(...handlers)
  })

  it('lists bookings for a date', async () => {
    expect(await api.list(TOMORROW)).toEqual([PLANNING])
  })

  it('creates, updates and removes a booking', async () => {
    const created = await api.create({ date: TOMORROW, start: '12:00', end: '13:00' })
    expect(created).toMatchObject({ start: '12:00', title: undefined })

    const updated = await api.update(created.id, { ...created, title: 'Lunch talk' })
    expect(updated.title).toBe('Lunch talk')

    await api.remove(created.id)
    expect(await api.list(TOMORROW)).toEqual([PLANNING])
  })

  it('clears a title when the draft has none', async () => {
    const updated = await api.update('a', { date: TOMORROW, start: '10:00', end: '11:00' })
    expect(updated.title).toBeUndefined()
  })

  it('throws ConflictError for an overlap', async () => {
    const overlapping = api.create({ date: TOMORROW, start: '10:30', end: '11:30' })
    await expect(overlapping).rejects.toBeInstanceOf(ConflictError)
  })

  it('throws ValidationError with details for a broken rule', async () => {
    const tooShort = api.create({ date: TOMORROW, start: '12:00', end: '12:15' })
    await expect(tooShort).rejects.toMatchObject({
      name: 'ValidationError',
      details: [{ code: 'TOO_SHORT', field: 'end' }],
    })
  })

  it('throws NotFoundError for a missing id', async () => {
    await expect(api.remove('nope')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('error mapping', () => {
  beforeEach(() => server.resetHandlers())

  it('maps 400 / 404 / 409 to typed errors and keeps the server message', async () => {
    respondWith(409, { error: { code: 'CONFLICT', message: 'Taken' } })
    await expect(api.list(TOMORROW)).rejects.toMatchObject({
      name: 'ConflictError',
      message: 'Taken',
    })

    respondWith(400, { error: { code: 'VALIDATION_ERROR', message: 'Bad' } })
    await expect(api.list(TOMORROW)).rejects.toBeInstanceOf(ValidationError)

    respondWith(404, { error: { code: 'NOT_FOUND', message: 'Gone' } })
    await expect(api.list(TOMORROW)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('maps any other status to ServerError', async () => {
    respondWith(500, { error: { code: 'CONFLICT', message: 'Boom' } })
    await expect(api.list(TOMORROW)).rejects.toBeInstanceOf(ServerError)
  })

  it('uses a fallback message when the error body is not the expected shape', async () => {
    respondWith(409, 'not json')
    await expect(api.list(TOMORROW)).rejects.toMatchObject({
      name: 'ConflictError',
      message: 'Something went wrong. Please try again.',
    })
  })

  it('throws ServerError when a success response has the wrong shape', async () => {
    respondWith(200, [{ id: 1 }])
    await expect(api.list(TOMORROW)).rejects.toBeInstanceOf(ServerError)
  })

  it('throws ServerError when a success response is not JSON (e.g. an HTML page)', async () => {
    server.use(
      http.all(`${BOOKINGS_URL}*`, () => new HttpResponse('<!doctype html>', { status: 200 })),
    )
    await expect(api.list(TOMORROW)).rejects.toBeInstanceOf(ServerError)
  })

  it('throws NetworkError when there is no response', async () => {
    server.use(http.all(`${BOOKINGS_URL}*`, () => HttpResponse.error()))
    await expect(api.list(TOMORROW)).rejects.toBeInstanceOf(NetworkError)
  })
})
