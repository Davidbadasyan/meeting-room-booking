import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Plugin } from 'vue'
import { NetworkError, ServerError } from '@/shared/api'
import { QUERY_RETRY_LIMIT } from '@/shared/config'

/** Only errors that may go away on their own are worth retrying; a 400/404/409 will not change. */
function isTransientError(error: Error): boolean {
  if (error instanceof NetworkError) return true
  return error instanceof ServerError
}

/** `failureCount` is 0 after the first failure, so this allows exactly QUERY_RETRY_LIMIT retries. */
export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (failureCount >= QUERY_RETRY_LIMIT) return false
  return isTransientError(error)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
      // A retried write could book twice or hide a conflict; the user decides instead.
      mutations: { retry: false },
    },
  })
}

export const vueQueryProvider: Plugin = {
  install(app) {
    app.use(VueQueryPlugin, { queryClient: createQueryClient() })
  },
}
