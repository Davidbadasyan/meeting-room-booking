import { describe, expect, it } from 'vitest'
import { describeBooking, displayTitle, formatTimeRange } from '@/entities/booking/lib/format'

describe('booking formatting', () => {
  it('formats the time range with an en dash', () => {
    expect(formatTimeRange({ start: '10:00', end: '11:00' })).toBe('10:00–11:00')
  })

  it('shows "Untitled" when there is no title', () => {
    expect(displayTitle({})).toBe('Untitled')
    expect(displayTitle({ title: 'Planning' })).toBe('Planning')
  })

  it('describes a booking in one line', () => {
    const booking = { id: 'a', date: '2026-10-28', start: '10:00', end: '11:00' }
    expect(describeBooking(booking)).toBe('10:00–11:00, Untitled')
  })
})
