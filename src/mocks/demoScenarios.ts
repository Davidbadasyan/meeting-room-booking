/**
 * Demo switches for the mock server, turned on from the page URL:
 *
 *   ?simulateConflict=1  The next valid create or edit: someone else books the slot first -> 409.
 *   ?simulateError=1     The next list requests fail with 500, so the error state and Retry show.
 *   ?slow=1              Every response takes 2-4 s, so loading and submitting states are easy to see.
 *
 * Flags can be combined: `?slow=1&simulateConflict=1`. Reload the page to arm them again.
 */
export type DemoFlag = 'simulateConflict' | 'simulateError' | 'slow'

export type Latency = [min: number, max: number]

export const NORMAL_LATENCY: Latency = [300, 800]
export const SLOW_LATENCY: Latency = [2000, 4000]

/** The first request plus the client's one automatic retry, so the user sees the error and a manual Retry succeeds. */
const SIMULATED_LIST_FAILURES = 2

let isConflictArmed = false
let remainingListFailures = 0

export function hasDemoFlag(search: string, flag: DemoFlag): boolean {
  return new URLSearchParams(search).get(flag) === '1'
}

export function armConflict() {
  isConflictArmed = true
}

/** True once per arming. */
export function consumeConflict(): boolean {
  const wasArmed = isConflictArmed
  isConflictArmed = false
  return wasArmed
}

export function armListFailures() {
  remainingListFailures = SIMULATED_LIST_FAILURES
}

/** True for each of the armed failures, then false. */
export function consumeListFailure(): boolean {
  if (remainingListFailures === 0) return false

  remainingListFailures -= 1
  return true
}

export function latencyFor(search: string): Latency {
  if (hasDemoFlag(search, 'slow')) return SLOW_LATENCY
  return NORMAL_LATENCY
}
