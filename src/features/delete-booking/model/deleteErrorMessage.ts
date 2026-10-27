import { ApiError, NetworkError } from '@/shared/api'

const FALLBACK_MESSAGE = 'Could not delete the booking. Please try again.'

/** The typed API errors carry a message meant for people; anything else gets a generic one. */
export function deleteErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiError) return error.message
  return FALLBACK_MESSAGE
}
