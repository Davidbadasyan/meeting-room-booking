import type { z } from 'zod'
import { mapHttpError, NetworkError, ServerError } from '@/shared/api/errors'
import { HTTP_STATUS } from '@/shared/api/httpStatus'
import { readJson } from '@/shared/api/readJson'

const INVALID_RESPONSE_MESSAGE = 'The server sent an unexpected response.'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
}

/**
 * Sends a JSON request and returns the parsed body (undefined for 204).
 * Throws a typed error from `@/shared/api/errors` on failure.
 */
export async function httpRequest(url: string, options: RequestOptions = {}): Promise<unknown> {
  const response = await send(url, options)
  if (!response.ok) throw await mapHttpError(response)
  if (response.status === HTTP_STATUS.noContent) return undefined

  // A body that is not JSON (e.g. an HTML page from a misconfigured proxy) reads as undefined,
  // which parseResponse then reports as a ServerError instead of a raw SyntaxError.
  return readJson(response)
}

/** `fetch` only rejects when there is no response at all. */
async function send(url: string, { method = 'GET', body }: RequestOptions): Promise<Response> {
  try {
    return await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new NetworkError()
  }
}

/** Validates response data at the boundary, so everything after it can trust the types. */
export function parseResponse<Schema extends z.ZodTypeAny>(
  schema: Schema,
  data: unknown,
): z.output<Schema> {
  const result = schema.safeParse(data)
  if (!result.success) throw new ServerError(INVALID_RESPONSE_MESSAGE)

  return result.data
}
