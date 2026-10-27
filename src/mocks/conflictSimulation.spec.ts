import { describe, expect, it } from 'vitest'
import {
  armConflictSimulation,
  consumeConflictSimulation,
  hasSimulateConflictFlag,
} from './conflictSimulation'

describe('conflictSimulation', () => {
  it('fires once per arming', () => {
    expect(consumeConflictSimulation()).toBe(false)
    armConflictSimulation()
    expect(consumeConflictSimulation()).toBe(true)
    expect(consumeConflictSimulation()).toBe(false)
  })

  it('reads the ?simulateConflict=1 flag', () => {
    expect(hasSimulateConflictFlag('?simulateConflict=1')).toBe(true)
    expect(hasSimulateConflictFlag('?date=2026-10-27&simulateConflict=1')).toBe(true)
    expect(hasSimulateConflictFlag('?simulateConflict=0')).toBe(false)
    expect(hasSimulateConflictFlag('')).toBe(false)
  })
})
