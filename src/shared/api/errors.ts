import { apiErrorBodySchema, type ApiErrorDetail } from '@/shared/api/errorBody'
import { HTTP_STATUS } from '@/shared/api/httpStatus'
import { readJson } from '@/shared/api/readJson'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE = 'Could not reach the server. Check your connection and try again.'

/** An error response from the server, with optional per-field details. */
export class ApiError extends Error {
  details: ApiErrorDetail[]

  constructor(message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.details = details
  }
}

/** 400: the input breaks a rule or has the wrong format. */
export class ValidationError extends ApiError {
  name = 'ValidationError'
}

/** 409: the slot was taken, usually by someone else in the meantime. */
export class ConflictError extends ApiError {
  name = 'ConflictError'
}

/** 404: the booking no longer exists. */
export class NotFoundError extends ApiError {
  name = 'NotFoundError'
}

/** Any other status, or a response we cannot read. */
export class ServerError extends ApiError {
  name = 'ServerError'
}

/** The request never got a response (offline, DNS, CORS). */
export class NetworkError extends Error {
  name = 'NetworkError'

  constructor() {
    super(NETWORK_MESSAGE)
  }
}

const errorClassByStatus: Record<number, typeof ApiError> = {
  [HTTP_STATUS.badRequest]: ValidationError,
  [HTTP_STATUS.notFound]: NotFoundError,
  [HTTP_STATUS.conflict]: ConflictError,
}

export async function mapHttpError(response: Response): Promise<ApiError> {
  const ErrorClass = errorClassByStatus[response.status] ?? ServerError
  const body = apiErrorBodySchema.safeParse(await readJson(response))
  if (!body.success) return new ErrorClass(FALLBACK_MESSAGE)

  return new ErrorClass(body.data.error.message, body.data.error.details)
}
