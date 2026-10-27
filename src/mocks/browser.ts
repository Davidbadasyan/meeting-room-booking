import { setupWorker } from 'msw/browser'
import { armConflictSimulation, hasSimulateConflictFlag } from './conflictSimulation'
import { createHandlers } from './handlers'
import { createBookingStore, createSeed, localStoragePersistence } from './store'

export const store = createBookingStore(createSeed(new Date()), localStoragePersistence)

export const worker = setupWorker(...createHandlers({ store }))

if (hasSimulateConflictFlag(window.location.search)) armConflictSimulation()
