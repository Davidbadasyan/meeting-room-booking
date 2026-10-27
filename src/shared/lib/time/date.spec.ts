import { describe, expect, it } from 'vitest'
import { isPastDate, isPastTime, isRealDate, toIsoDate } from '@/shared/lib/time/date'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)

describe('isRealDate', () => {
  it('accepts real calendar dates', () => {
    expect(isRealDate('2026-10-27')).toBe(true)
    expect(isRealDate('2028-02-29')).toBe(true)
  })

  it('rejects impossible days and other formats', () => {
    expect(isRealDate('2026-02-30')).toBe(false)
    expect(isRealDate('2026-13-01')).toBe(false)
    expect(isRealDate('2026-1-5')).toBe(false)
    expect(isRealDate('27-10-2026')).toBe(false)
    expect(isRealDate('')).toBe(false)
  })
})

describe('isPastDate', () => {
  it('is true only for days before today', () => {
    expect(isPastDate('2026-10-26', NOW)).toBe(true)
    expect(isPastDate('2026-10-27', NOW)).toBe(false)
    expect(isPastDate('2026-10-28', NOW)).toBe(false)
  })
})

describe('isPastTime', () => {
  it('compares against the current minute today', () => {
    expect(isPastTime('2026-10-27', '11:59', NOW)).toBe(true)
    expect(isPastTime('2026-10-27', '12:00', NOW)).toBe(false)
    expect(isPastTime('2026-10-27', '12:15', NOW)).toBe(false)
  })

  it('treats any time on a past day as past and any time on a future day as not', () => {
    expect(isPastTime('2026-10-26', '17:00', NOW)).toBe(true)
    expect(isPastTime('2026-10-28', '09:00', NOW)).toBe(false)
  })
})

describe('local dates early in the morning (tests run in UTC+4)', () => {
  // 01:30 local in UTC+4 is still 21:30 the previous day in UTC.
  const EARLY_MORNING = new Date(2026, 9, 27, 1, 30)

  it('runs in a time zone where UTC is on the previous day', () => {
    // Guard: without this, the tests below would pass even with a UTC bug.
    expect(EARLY_MORNING.toISOString().slice(0, 10)).toBe('2026-10-26')
  })

  it('formats the local calendar date, not the UTC one', () => {
    expect(toIsoDate(EARLY_MORNING)).toBe('2026-10-27')
  })

  it('treats today as today and yesterday as past', () => {
    expect(isPastDate('2026-10-27', EARLY_MORNING)).toBe(false)
    expect(isPastDate('2026-10-26', EARLY_MORNING)).toBe(true)
  })

  it('compares times against local minutes', () => {
    expect(isPastTime('2026-10-27', '01:00', EARLY_MORNING)).toBe(true)
    expect(isPastTime('2026-10-27', '09:00', EARLY_MORNING)).toBe(false)
  })

  it('parses a date string as a local date', () => {
    expect(isRealDate('2026-10-27')).toBe(true)
  })
})
