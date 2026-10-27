import { describe, expect, it } from 'vitest'
import {
  generateTimeOptions,
  minutesToTime,
  TIME_PATTERN,
  timeToMinutes,
} from '@/shared/lib/time/time'

describe('timeToMinutes / minutesToTime', () => {
  it('converts both ways', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(1439)
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(0)).toBe('00:00')
  })

  it('round-trips', () => {
    for (const time of ['09:00', '12:45', '18:00']) {
      expect(minutesToTime(timeToMinutes(time))).toBe(time)
    }
  })
})

describe('TIME_PATTERN', () => {
  it('accepts HH:mm only', () => {
    expect(TIME_PATTERN.test('09:00')).toBe(true)
    expect(TIME_PATTERN.test('23:59')).toBe(true)
    expect(TIME_PATTERN.test('9:00')).toBe(false)
    expect(TIME_PATTERN.test('24:00')).toBe(false)
    expect(TIME_PATTERN.test('12:60')).toBe(false)
  })
})

describe('generateTimeOptions', () => {
  it('includes both ends at the given step', () => {
    const options = generateTimeOptions('09:00', '18:00', 15)
    expect(options[0]).toBe('09:00')
    expect(options[options.length - 1]).toBe('18:00')
    expect(options).toHaveLength(37) // 9h * 4 + 1
  })

  it('accepts a custom range and step', () => {
    expect(generateTimeOptions('10:00', '11:00', 30)).toEqual(['10:00', '10:30', '11:00'])
  })
})
