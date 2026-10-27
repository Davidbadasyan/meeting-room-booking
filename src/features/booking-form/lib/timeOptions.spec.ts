import { describe, expect, it } from 'vitest'
import {
  endTimeOptions,
  formatDuration,
  startTimeOptions,
} from '@/features/booking-form/lib/timeOptions'

// Local time: 2026-10-27 12:10
const NOW = new Date(2026, 9, 27, 12, 10)

describe('startTimeOptions', () => {
  it('offers 09:00 to 17:30 every 15 minutes', () => {
    const options = startTimeOptions('2026-10-28', NOW)
    expect(options[0]?.value).toBe('09:00')
    expect(options[options.length - 1]?.value).toBe('17:30')
    expect(options).toHaveLength(35)
    expect(options.every((option) => option.isDisabled === false)).toBe(true)
  })

  it('disables start times that have passed today', () => {
    const options = startTimeOptions('2026-10-27', NOW)
    const disabled = options.filter((option) => option.isDisabled).map((option) => option.value)
    expect(disabled[disabled.length - 1]).toBe('12:00')
    expect(options.find((option) => option.value === '12:15')?.isDisabled).toBe(false)
  })
})

describe('endTimeOptions', () => {
  it('is empty until a start time is chosen', () => {
    expect(endTimeOptions('')).toEqual([])
  })

  it('runs from start + 30 min to start + 2 h with durations in the label', () => {
    const options = endTimeOptions('10:00')
    expect(options.map((option) => option.value)).toEqual([
      '10:30',
      '10:45',
      '11:00',
      '11:15',
      '11:30',
      '11:45',
      '12:00',
    ])
    expect(options[0]?.label).toBe('10:30 (30 min)')
    expect(options[options.length - 1]?.label).toBe('12:00 (2 h)')
  })

  it('stops at 18:00', () => {
    expect(endTimeOptions('17:00').map((option) => option.value)).toEqual([
      '17:30',
      '17:45',
      '18:00',
    ])
  })
})

describe('formatDuration', () => {
  it.each([
    [30, '30 min'],
    [60, '1 h'],
    [105, '1 h 45 min'],
  ])('%i minutes is "%s"', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})
