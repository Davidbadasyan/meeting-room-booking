/**
 * Demo switches for the mock server, turned on from the page URL:
 *
 *   ?simulateConflict=1  The next valid create or edit: someone else books the slot first -> 409.
 *   ?simulateError=1     List requests fail with 500 for 5 s, so the error state shows; Retry after that works.
 *   ?slow=1              Every response takes 2-4 s, so loading and submitting states are easy to see.
 *
 * Flags can be combined: `?slow=1&simulateConflict=1`. Reload the page to arm them again.
 */
export type DemoFlag = 'simulateConflict' | 'simulateError' | 'slow'

export type Latency = [min: number, max: number]

export const NORMAL_LATENCY: Latency = [300, 800]
export const SLOW_LATENCY: Latency = [2000, 4000]

/** Long enough to outlast any automatic retry, short enough that a manual Retry soon succeeds. */
const LIST_FAILURE_DURATION_MS = 5000

let isConflictArmed = false
let listFailsUntilMs = 0

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

export function armListFailures(nowMs: number) {
  listFailsUntilMs = nowMs + LIST_FAILURE_DURATION_MS
}

export function isListFailing(nowMs: number): boolean {
  return nowMs < listFailsUntilMs
}

export function latencyFor(search: string): Latency {
  if (hasDemoFlag(search, 'slow')) return SLOW_LATENCY
  return NORMAL_LATENCY
}
