/**
 * Demo of "someone else booked this slot first": when armed, the next create or
 * update makes the server insert a competing booking for the same slot, so the
 * request fails with 409.
 *
 * Arm it with `?simulateConflict=1` on the page URL, on a single API request,
 * or by calling `armConflictSimulation()` (e.g. from a dev toggle).
 */
let armed = false

export function armConflictSimulation() {
  armed = true
}

export function disarmConflictSimulation() {
  armed = false
}

export function isConflictSimulationArmed() {
  return armed
}

/** Returns true once per arming. */
export function consumeConflictSimulation(): boolean {
  const wasArmed = armed
  armed = false
  return wasArmed
}

export function hasSimulateConflictFlag(search: string): boolean {
  return new URLSearchParams(search).get('simulateConflict') === '1'
}
