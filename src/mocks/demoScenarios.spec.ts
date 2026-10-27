import { describe, expect, it } from 'vitest'
import {
  armConflict,
  armListFailures,
  consumeConflict,
  consumeListFailure,
  hasDemoFlag,
  latencyFor,
  NORMAL_LATENCY,
  SLOW_LATENCY,
} from '@/mocks/demoScenarios'

describe('demoScenarios', () => {
  it('reads flags from the page URL', () => {
    expect(hasDemoFlag('?simulateConflict=1', 'simulateConflict')).toBe(true)
    expect(hasDemoFlag('?date=2026-10-27&simulateError=1', 'simulateError')).toBe(true)
    expect(hasDemoFlag('?slow=0', 'slow')).toBe(false)
    expect(hasDemoFlag('', 'slow')).toBe(false)
  })

  it('fires the conflict once per arming', () => {
    expect(consumeConflict()).toBe(false)
    armConflict()
    expect(consumeConflict()).toBe(true)
    expect(consumeConflict()).toBe(false)
  })

  it('fails two list requests per arming (first try + one automatic retry)', () => {
    expect(consumeListFailure()).toBe(false)
    armListFailures()
    expect(consumeListFailure()).toBe(true)
    expect(consumeListFailure()).toBe(true)
    expect(consumeListFailure()).toBe(false)
  })

  it('picks slow latency with ?slow=1', () => {
    expect(latencyFor('?slow=1')).toEqual(SLOW_LATENCY)
    expect(latencyFor('')).toEqual(NORMAL_LATENCY)
  })
})
