import { describe, expect, it } from 'vitest'
import {
  generateTimeOptions,
  isPastDate,
  isPastTime,
  isValidDate,
  isValidTime,
  minutesToTime,
  timeToMinutes,
} from '../time'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)

describe('timeToMinutes / minutesToTime', () => {
  it('converts both ways', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(1439)
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(0)).toBe('00:00')
  })

  it('round-trips', () => {
    for (const t of ['09:00', '12:45', '18:00']) expect(minutesToTime(timeToMinutes(t))).toBe(t)
  })

  it('rejects malformed input', () => {
    expect(() => timeToMinutes('9:00')).toThrow('Invalid time')
    expect(() => timeToMinutes('24:00')).toThrow('Invalid time')
    expect(() => minutesToTime(-1)).toThrow('out of range')
    expect(() => minutesToTime(1440)).toThrow('out of range')
    expect(() => minutesToTime(1.5)).toThrow('out of range')
  })
})

describe('isValidTime / isValidDate', () => {
  it('validates time format', () => {
    expect(isValidTime('09:00')).toBe(true)
    expect(isValidTime('9:00')).toBe(false)
    expect(isValidTime('12:60')).toBe(false)
    expect(isValidTime(900)).toBe(false)
  })

  it('validates real calendar dates', () => {
    expect(isValidDate('2026-10-27')).toBe(true)
    expect(isValidDate('2028-02-29')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
    expect(isValidDate('27-10-2026')).toBe(false)
    expect(isValidDate(undefined)).toBe(false)
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

describe('generateTimeOptions', () => {
  it('covers working hours inclusive at the slot step', () => {
    const options = generateTimeOptions()
    expect(options[0]).toBe('09:00')
    expect(options[options.length - 1]).toBe('18:00')
    expect(options).toHaveLength(37) // 9h * 4 + 1
  })

  it('accepts a custom range and step', () => {
    expect(generateTimeOptions('10:00', '11:00', 30)).toEqual(['10:00', '10:30', '11:00'])
  })
})
