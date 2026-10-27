import { delay, http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import {
  BOOKINGS_ENDPOINT,
  isBookingLocked,
  validateBooking,
  type Booking,
  type BookingDraft,
  type BookingError,
} from '@/entities/booking'
import type { ApiErrorBody, ApiErrorCode } from '@/shared/api'
import { isValidDate } from '@/shared/lib/time'
import { consumeConflictSimulation, hasSimulateConflictFlag } from './conflictSimulation'
import type { BookingStore } from './store'

export interface HandlerOptions {
  store: BookingStore
  now?: () => Date
  /** Random response delay range in ms, so loading states are visible. */
  latency?: [min: number, max: number]
  shouldSimulateConflict?: (request: Request) => boolean
}

const OTHER_USER_TITLE = 'Booked by someone else'

const defaultShouldSimulateConflict = (request: Request) =>
  hasSimulateConflictFlag(new URL(request.url).search) || consumeConflictSimulation()

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: BookingError[],
) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message, details } }, { status })
}

const str = (value: unknown) => (typeof value === 'string' ? value : '')

function normalizeTitle(value: unknown): string | undefined {
  const title = str(value).trim()
  return title === '' ? undefined : title
}

async function readBody(request: Request): Promise<Record<string, unknown> | undefined> {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}

export function createHandlers({
  store,
  now = () => new Date(),
  latency = [300, 800],
  shouldSimulateConflict = defaultShouldSimulateConflict,
}: HandlerOptions) {
  const url = `*${BOOKINGS_ENDPOINT}`

  const wait = () => {
    const [min, max] = latency
    return delay(min + Math.round(Math.random() * (max - min)))
  }

  /** Runs the shared domain rules and decides between 400, 409 and success. */
  function check(request: Request, draft: BookingDraft, editingId?: string) {
    let errors = validateBooking(draft, store.all(), now(), editingId)

    if (errors.length === 0 && shouldSimulateConflict(request)) {
      store.insert({
        date: draft.date,
        start: draft.start,
        end: draft.end,
        title: OTHER_USER_TITLE,
      })
      errors = validateBooking(draft, store.all(), now(), editingId)
    }

    if (errors.length === 0) return undefined
    // Fix-your-input problems take priority; 409 means the input is fine but the slot is taken.
    if (errors.some((e) => e.code !== 'OVERLAP')) {
      return errorResponse(400, 'VALIDATION_ERROR', 'The booking is invalid.', errors)
    }
    return errorResponse(409, 'CONFLICT', 'This slot is already booked.', errors)
  }

  function lockedResponse() {
    return errorResponse(400, 'VALIDATION_ERROR', 'This booking has already started.', [
      {
        code: 'BOOKING_LOCKED',
        field: 'start',
        message: 'Bookings that have already started cannot be changed.',
      },
    ])
  }

  return [
    http.get<PathParams, DefaultBodyType, Booking[] | ApiErrorBody>(url, async ({ request }) => {
      await wait()
      const date = new URL(request.url).searchParams.get('date')
      if (!isValidDate(date)) {
        return errorResponse(400, 'VALIDATION_ERROR', 'Query parameter "date" must be YYYY-MM-DD.')
      }
      return HttpResponse.json<Booking[]>(store.byDate(date))
    }),

    http.post<PathParams, DefaultBodyType, Booking | ApiErrorBody>(url, async ({ request }) => {
      await wait()
      const body = await readBody(request)
      if (!body)
        return errorResponse(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.')

      const draft: BookingDraft = {
        date: str(body.date),
        start: str(body.start),
        end: str(body.end),
        title: normalizeTitle(body.title),
      }
      const failure = check(request, draft)
      if (failure) return failure

      return HttpResponse.json<Booking>(store.insert(draft), { status: 201 })
    }),

    http.patch<{ id: string }, DefaultBodyType, Booking | ApiErrorBody>(
      `${url}/:id`,
      async ({ request, params }) => {
        await wait()
        const existing = store.get(params.id)
        if (!existing) return errorResponse(404, 'NOT_FOUND', 'Booking not found.')
        if (isBookingLocked(existing, now())) return lockedResponse()

        const body = await readBody(request)
        if (!body)
          return errorResponse(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.')

        const { id, ...current } = existing
        const draft: BookingDraft = {
          date: 'date' in body ? str(body.date) : current.date,
          start: 'start' in body ? str(body.start) : current.start,
          end: 'end' in body ? str(body.end) : current.end,
          title: 'title' in body ? normalizeTitle(body.title) : current.title,
        }
        const failure = check(request, draft, id)
        if (failure) return failure

        return HttpResponse.json<Booking>(store.replace({ ...draft, id }))
      },
    ),

    http.delete<{ id: string }, DefaultBodyType, ApiErrorBody | null>(
      `${url}/:id`,
      async ({ params }) => {
        await wait()
        const existing = store.get(params.id)
        if (!existing) return errorResponse(404, 'NOT_FOUND', 'Booking not found.')
        if (isBookingLocked(existing, now())) return lockedResponse()

        store.remove(existing.id)
        return new HttpResponse(null, { status: 204 })
      },
    ),
  ]
}
