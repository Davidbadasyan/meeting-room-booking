import { setupWorker } from 'msw/browser'
import { armConflict, armListFailures, hasDemoFlag, latencyFor } from '@/mocks/demoScenarios'
import { createHandlers } from '@/mocks/handlers'
import { createBookingStore, createSeed, localStoragePersistence } from '@/mocks/store'

const search = window.location.search

export const store = createBookingStore(createSeed(new Date()), localStoragePersistence)

export const worker = setupWorker(...createHandlers({ store, latency: latencyFor(search) }))

if (hasDemoFlag(search, 'simulateConflict')) armConflict()
if (hasDemoFlag(search, 'simulateError')) armListFailures()
