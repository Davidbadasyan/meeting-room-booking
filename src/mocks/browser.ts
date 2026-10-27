import { setupWorker } from 'msw/browser'
import { armConflictSimulation, hasSimulateConflictFlag } from '@/mocks/conflictSimulation'
import { createHandlers } from '@/mocks/handlers'
import { createBookingStore, createSeed, localStoragePersistence } from '@/mocks/store'

export const store = createBookingStore(createSeed(new Date()), localStoragePersistence)

export const worker = setupWorker(...createHandlers({ store }))

if (hasSimulateConflictFlag(window.location.search)) armConflictSimulation()
