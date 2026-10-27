import { delay, http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import type { ZodError } from 'zod'
import {
  BOOKINGS_ENDPOINT,
  bookingDraftDtoSchema,
  bookingPatchDtoSchema,
  createBookingError,
  hasStarted,
  isoDateSchema,
  validateBooking,
  type Booking,
  type BookingDraft,
  type BookingError,
} from '@/entities/booking'
import {
  HTTP_STATUS,
  readJson,
  type ApiErrorBody,
  type ApiErrorCode,
  type ApiErrorDetail,
} from '@/shared/api'
import { consumeConflict, isListFailing, NORMAL_LATENCY, type Latency } from '@/mocks/demoScenarios'
import type { BookingStore } from '@/mocks/store'

const OTHER_USER_TITLE = 'Booked by someone else'

export interface HandlerOptions {
  store: BookingStore
  now?: () => Date
  /** Response delay range in ms, so loading states are visible. */
  latency?: Latency
  shouldSimulateConflict?: () => boolean
  shouldSimulateListFailure?: () => boolean
}

type ErrorResponse = HttpResponse<ApiErrorBody>

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[],
): ErrorResponse {
  return HttpResponse.json({ error: { code, message, details } }, { status })
}

function invalidFormatResponse(error: ZodError): ErrorResponse {
  const details = error.issues.map((issue) => ({
    code: 'INVALID_FORMAT',
    field: issue.path.join('.'),
    message: issue.message,
  }))
  return errorResponse(
    HTTP_STATUS.badRequest,
    'VALIDATION_ERROR',
    'The request is invalid.',
    details,
  )
}

function notFoundResponse(): ErrorResponse {
  return errorResponse(HTTP_STATUS.notFound, 'NOT_FOUND', 'Booking not found.')
}

function alreadyStartedResponse(): ErrorResponse {
  const details = [createBookingError('ALREADY_STARTED', 'start')]
  return errorResponse(
    HTTP_STATUS.badRequest,
    'VALIDATION_ERROR',
    'The booking has started.',
    details,
  )
}

/** Only an overlap means "the slot is taken" (409); anything else is bad input (400). */
function ruleErrorResponse(errors: BookingError[]): ErrorResponse {
  const isOnlyOverlap = errors.every((error) => error.code === 'OVERLAP')
  if (isOnlyOverlap) {
    return errorResponse(HTTP_STATUS.conflict, 'CONFLICT', 'This slot is already booked.', errors)
  }
  return errorResponse(
    HTTP_STATUS.badRequest,
    'VALIDATION_ERROR',
    'The booking is invalid.',
    errors,
  )
}

function simulatedServerErrorResponse(): ErrorResponse {
  return errorResponse(HTTP_STATUS.internalServerError, 'SERVER_ERROR', 'Simulated server error.')
}

function randomBetween(min: number, max: number): number {
  return min + Math.round(Math.random() * (max - min))
}

export function createHandlers({
  store,
  now = () => new Date(),
  latency = NORMAL_LATENCY,
  shouldSimulateConflict = consumeConflict,
  shouldSimulateListFailure = () => isListFailing(Date.now()),
}: HandlerOptions) {
  const bookingsUrl = `*${BOOKINGS_ENDPOINT}`
  const bookingUrl = `${bookingsUrl}/:id`

  function wait() {
    return delay(randomBetween(...latency))
  }

  function findErrors(draft: BookingDraft, editingId?: string): BookingError[] {
    return validateBooking(draft, store.all(), now(), editingId)
  }

  /** Demo: someone else books the same slot just before this request is handled. */
  function insertCompetingBookingIfSimulated(draft: BookingDraft, editingId?: string) {
    const isValid = findErrors(draft, editingId).length === 0
    if (!isValid) return
    if (!shouldSimulateConflict()) return
    store.insert({ ...draft, title: OTHER_USER_TITLE })
  }

  return [
    http.get<PathParams, DefaultBodyType, Booking[] | ApiErrorBody>(
      bookingsUrl,
      async ({ request }) => {
        // Checked on arrival, so ?slow=1 does not stretch the failure window.
        const isFailing = shouldSimulateListFailure()
        await wait()
        if (isFailing) return simulatedServerErrorResponse()

        const date = isoDateSchema.safeParse(new URL(request.url).searchParams.get('date'))
        if (!date.success) return invalidFormatResponse(date.error)

        return HttpResponse.json(store.byDate(date.data))
      },
    ),

    http.post<PathParams, DefaultBodyType, Booking | ApiErrorBody>(
      bookingsUrl,
      async ({ request }) => {
        await wait()
        const body = bookingDraftDtoSchema.safeParse(await readJson(request))
        if (!body.success) return invalidFormatResponse(body.error)

        const draft = body.data
        insertCompetingBookingIfSimulated(draft)
        const errors = findErrors(draft)
        if (errors.length > 0) return ruleErrorResponse(errors)

        return HttpResponse.json(store.insert(draft), { status: HTTP_STATUS.created })
      },
    ),

    http.patch<{ id: string }, DefaultBodyType, Booking | ApiErrorBody>(
      bookingUrl,
      async ({ request, params }) => {
        await wait()
        const booking = store.get(params.id)
        if (!booking) return notFoundResponse()
        if (hasStarted(booking, now())) return alreadyStartedResponse()

        const body = bookingPatchDtoSchema.safeParse(await readJson(request))
        if (!body.success) return invalidFormatResponse(body.error)

        const updated = { ...booking, ...body.data }
        insertCompetingBookingIfSimulated(updated, booking.id)
        const errors = findErrors(updated, booking.id)
        if (errors.length > 0) return ruleErrorResponse(errors)

        return HttpResponse.json(store.replace(updated))
      },
    ),

    http.delete<{ id: string }, DefaultBodyType, ApiErrorBody | null>(
      bookingUrl,
      async ({ params }) => {
        await wait()
        const booking = store.get(params.id)
        if (!booking) return notFoundResponse()
        if (hasStarted(booking, now())) return alreadyStartedResponse()

        store.remove(booking.id)
        return new HttpResponse(null, { status: HTTP_STATUS.noContent })
      },
    ),
  ]
}
