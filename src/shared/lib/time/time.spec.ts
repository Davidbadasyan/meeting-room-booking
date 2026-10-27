import { describe, expect, it } from 'vitest'
import { generateTimeOptions, isValidTime, minutesToTime, timeToMinutes } from './time'

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

describe('isValidTime', () => {
  it('validates time format', () => {
    expect(isValidTime('09:00')).toBe(true)
    expect(isValidTime('9:00')).toBe(false)
    expect(isValidTime('12:60')).toBe(false)
    expect(isValidTime(900)).toBe(false)
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
