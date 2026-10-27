import { VueQueryPlugin, type QueryClient } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import type { SetupServer } from 'msw/node'
import { defineComponent } from 'vue'
import { createQueryClient } from '@/app/providers/vueQuery'
import { BOOKINGS_API_KEY, createHttpBookingsApi, type Booking } from '@/entities/booking'
import { createHandlers } from '@/mocks/handlers'
import { createBookingStore, type BookingStore } from '@/mocks/store'
import { CLOCK_KEY, type Clock } from '@/shared/lib/clock'

/**
 * Test-only helpers: the real HTTP client talks to the real mock handlers,
 * intercepted in Node by an MSW `setupServer` the spec file owns.
 */
const TEST_BASE_URL = 'http://localhost'

export interface TestBackend {
  store: BookingStore
  /** The next valid create/update gets a 409 because "someone else" booked the slot. */
  simulateConflict: () => void
  /** The next list requests fail with 500. */
  simulateListFailure: () => void
}

export function startTestBackend(server: SetupServer, seed: Booking[], serverNow: Date) {
  const store = createBookingStore(seed)
  let isConflictSimulated = false
  let isListFailureSimulated = false

  server.resetHandlers(
    ...createHandlers({
      store,
      now: () => serverNow,
      latency: [0, 0],
      shouldSimulateConflict: () => isConflictSimulated,
      shouldSimulateListFailure: () => isListFailureSimulated,
    }),
  )

  const backend: TestBackend = {
    store,
    simulateConflict: () => {
      isConflictSimulated = true
    },
    simulateListFailure: () => {
      isListFailureSimulated = true
    },
  }
  return backend
}

/** Real app defaults, minus the retry delay so retry tests stay fast. */
function createTestQueryClient(): QueryClient {
  const queryClient = createQueryClient()
  const defaults = queryClient.getDefaultOptions()
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retryDelay: 0 } })
  return queryClient
}

/** Runs a composable inside a mounted component with Vue Query, the API and a fixed clock. */
export function mountComposable<Result>(useComposable: () => Result, clock: Clock) {
  const queryClient = createTestQueryClient()
  const results: Result[] = []
  const Host = defineComponent({
    setup() {
      results.push(useComposable())
      return () => null
    },
  })

  const wrapper = mount(Host, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      provide: {
        [BOOKINGS_API_KEY]: createHttpBookingsApi(TEST_BASE_URL),
        [CLOCK_KEY]: clock,
      },
    },
  })

  const [result] = results
  if (result === undefined) throw new Error('The composable did not return anything.')

  return { result, queryClient, unmount: () => wrapper.unmount() }
}
