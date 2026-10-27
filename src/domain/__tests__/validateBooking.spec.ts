import { describe, expect, it } from 'vitest'
import type { Booking, BookingDraft } from '../types'
import { isBookingLocked, overlaps, validateBooking } from '../validateBooking'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'
const YESTERDAY = '2026-10-26'

const draft = (start: string, end: string, date = TOMORROW): BookingDraft => ({ date, start, end })

const codes = (d: BookingDraft, existing: Booking[] = [], editingId?: string) =>
  validateBooking(d, existing, NOW, editingId).map((e) => e.code)

describe('validateBooking', () => {
  it('accepts a normal booking', () => {
    expect(codes(draft('10:00', '11:00'))).toEqual([])
  })

  it('treats title as optional', () => {
    expect(codes({ ...draft('10:00', '11:00'), title: 'Standup' })).toEqual([])
    expect(codes(draft('10:00', '11:00'))).toEqual([])
  })

  describe('working hours 09:00–18:00', () => {
    it('allows a 09:00 start and an 18:00 end', () => {
      expect(codes(draft('09:00', '10:00'))).toEqual([])
      expect(codes(draft('17:00', '18:00'))).toEqual([])
    })

    it('rejects a start before 09:00', () => {
      expect(codes(draft('08:45', '09:30'))).toEqual(['OUTSIDE_WORKING_HOURS'])
    })

    it('rejects an end after 18:00', () => {
      expect(codes(draft('17:30', '18:15'))).toEqual(['OUTSIDE_WORKING_HOURS'])
    })

    it('reports the field that is out of range', () => {
      const errors = validateBooking(draft('17:30', '18:15'), [], NOW)
      expect(errors[0]?.field).toBe('end')
    })
  })

  describe('start < end', () => {
    it('rejects start equal to end', () => {
      expect(codes(draft('10:00', '10:00'))).toEqual(['START_NOT_BEFORE_END'])
    })

    it('rejects start after end, without also reporting duration errors', () => {
      expect(codes(draft('11:00', '10:00'))).toEqual(['START_NOT_BEFORE_END'])
    })
  })

  describe('duration', () => {
    it('accepts exactly 30 minutes', () => {
      expect(codes(draft('10:00', '10:30'))).toEqual([])
    })

    it('rejects 29 minutes', () => {
      expect(codes(draft('10:00', '10:29'))).toEqual(['TOO_SHORT'])
    })

    it('accepts exactly 2 hours', () => {
      expect(codes(draft('10:00', '12:00'))).toEqual([])
    })

    it('rejects 2 hours and 1 minute', () => {
      expect(codes(draft('10:00', '12:01'))).toEqual(['TOO_LONG'])
    })
  })

  describe('overlap', () => {
    const existing: Booking[] = [{ id: 'a', date: TOMORROW, start: '10:00', end: '11:00' }]

    it('allows touching on either side', () => {
      expect(codes(draft('11:00', '12:00'), existing)).toEqual([])
      expect(codes(draft('09:00', '10:00'), existing)).toEqual([])
    })

    it.each([
      ['partial overlap at the start', '09:30', '10:30'],
      ['partial overlap at the end', '10:30', '11:30'],
      ['contained inside', '10:15', '10:45'],
      ['containing', '09:30', '11:30'],
      ['identical', '10:00', '11:00'],
    ])('rejects %s', (_, start, end) => {
      expect(codes(draft(start, end), existing)).toEqual(['OVERLAP'])
    })

    it('returns the conflicting booking', () => {
      const [error] = validateBooking(draft('10:30', '11:30'), existing, NOW)
      expect(error?.conflictWith?.id).toBe('a')
    })

    it('ignores bookings on other dates', () => {
      const other: Booking[] = [{ id: 'b', date: '2026-10-29', start: '10:00', end: '11:00' }]
      expect(codes(draft('10:00', '11:00'), other)).toEqual([])
    })
  })

  describe('past dates and times', () => {
    it('rejects a past date', () => {
      expect(codes(draft('10:00', '11:00', YESTERDAY))).toEqual(['PAST_DATE'])
    })

    it('rejects a start time that has passed today', () => {
      expect(codes(draft('11:30', '12:30', TODAY))).toEqual(['PAST_TIME'])
    })

    it('allows a start in the current minute today', () => {
      expect(codes(draft('12:00', '13:00', TODAY))).toEqual([])
    })

    it('allows a later time today', () => {
      expect(codes(draft('14:00', '15:00', TODAY))).toEqual([])
    })
  })

  describe('editing', () => {
    const existing: Booking[] = [
      { id: 'a', date: TOMORROW, start: '10:00', end: '11:00' },
      { id: 'b', date: TOMORROW, start: '13:00', end: '14:00' },
    ]

    it('is valid when the time is unchanged', () => {
      expect(codes(draft('10:00', '11:00'), existing, 'a')).toEqual([])
    })

    it('excludes itself from the overlap check when moved', () => {
      expect(codes(draft('10:30', '11:30'), existing, 'a')).toEqual([])
    })

    it('still detects overlaps with other bookings', () => {
      expect(codes(draft('12:30', '13:30'), existing, 'a')).toEqual(['OVERLAP'])
    })
  })

  describe('malformed input', () => {
    it('reports invalid date and times', () => {
      expect(codes({ date: '2026-02-30', start: '10:00', end: '11:00' })).toEqual(['INVALID_DATE'])
      expect(codes(draft('ten', '11:00'))).toEqual(['INVALID_TIME'])
      expect(codes(draft('10:00', ''))).toEqual(['INVALID_TIME'])
    })
  })

  it('can report several errors at once', () => {
    expect(codes(draft('08:00', '18:30', YESTERDAY))).toEqual([
      'OUTSIDE_WORKING_HOURS',
      'OUTSIDE_WORKING_HOURS',
      'TOO_LONG',
      'PAST_DATE',
    ])
  })
})

describe('overlaps', () => {
  it('uses half-open intervals', () => {
    expect(overlaps({ start: '10:00', end: '11:00' }, { start: '11:00', end: '12:00' })).toBe(false)
    expect(overlaps({ start: '10:00', end: '11:01' }, { start: '11:00', end: '12:00' })).toBe(true)
  })
})

describe('isBookingLocked', () => {
  it('locks bookings that have started or are on a past day', () => {
    expect(isBookingLocked({ date: TODAY, start: '11:00' }, NOW)).toBe(true)
    expect(isBookingLocked({ date: YESTERDAY, start: '15:00' }, NOW)).toBe(true)
  })

  it('does not lock upcoming bookings', () => {
    expect(isBookingLocked({ date: TODAY, start: '12:00' }, NOW)).toBe(false)
    expect(isBookingLocked({ date: TOMORROW, start: '09:00' }, NOW)).toBe(false)
  })
})
