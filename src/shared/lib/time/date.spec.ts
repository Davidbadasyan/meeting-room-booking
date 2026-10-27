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

describe('local dates near midnight (tests run outside UTC, see vitest.config.ts)', () => {
  // East of UTC the local day starts before the UTC day; west of UTC it ends after it.
  // One of these two moments is on a different UTC date in any non-UTC time zone.
  const EARLY_MORNING = new Date(2026, 9, 27, 1, 30)
  const LATE_EVENING = new Date(2026, 9, 27, 23, 30)
  const LOCAL_DAY = '2026-10-27'

  it('runs in a time zone where the UTC date differs at one of the two moments', () => {
    // Guard: in UTC itself the tests below would pass even with a toISOString bug.
    const utcDays = [EARLY_MORNING, LATE_EVENING].map((moment) => moment.toISOString().slice(0, 10))
    expect(utcDays).not.toEqual([LOCAL_DAY, LOCAL_DAY])
  })

  it.each([
    ['01:30', EARLY_MORNING],
    ['23:30', LATE_EVENING],
  ])('formats the local calendar date at %s', (_, moment) => {
    expect(toIsoDate(moment)).toBe(LOCAL_DAY)
  })

  it.each([
    ['01:30', EARLY_MORNING],
    ['23:30', LATE_EVENING],
  ])('treats today as today and yesterday as past at %s', (_, moment) => {
    expect(isPastDate(LOCAL_DAY, moment)).toBe(false)
    expect(isPastDate('2026-10-26', moment)).toBe(true)
  })

  it('compares times against local minutes', () => {
    expect(isPastTime(LOCAL_DAY, '01:00', EARLY_MORNING)).toBe(true)
    expect(isPastTime(LOCAL_DAY, '09:00', EARLY_MORNING)).toBe(false)
    expect(isPastTime(LOCAL_DAY, '17:00', LATE_EVENING)).toBe(true)
  })

  it('parses a date string as a local date', () => {
    expect(isRealDate(LOCAL_DAY)).toBe(true)
  })
})
