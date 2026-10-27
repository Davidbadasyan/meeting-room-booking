import { describe, expect, it } from 'vitest'
import type { Booking, BookingDraft } from './booking'
import { hasStarted, isOverlapping, validateBooking } from './rules'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'
const YESTERDAY = '2026-10-26'

function draft(start: string, end: string, date = TOMORROW): BookingDraft {
  return { date, start, end }
}

function errorCodes(booking: BookingDraft, existing: Booking[] = [], editingId?: string) {
  return validateBooking(booking, existing, NOW, editingId).map((error) => error.code)
}

describe('validateBooking', () => {
  it('accepts a normal booking, with or without a title', () => {
    expect(errorCodes(draft('10:00', '11:00'))).toEqual([])
    expect(errorCodes({ ...draft('10:00', '11:00'), title: 'Standup' })).toEqual([])
  })

  it('returns the field and a message with each error', () => {
    const [error] = validateBooking(draft('10:00', '10:15'), [], NOW)
    expect(error).toEqual({
      code: 'TOO_SHORT',
      field: 'end',
      message: 'Minimum duration is 30 minutes',
    })
  })

  describe('working hours 09:00–18:00', () => {
    it('allows a 09:00 start and an 18:00 end', () => {
      expect(errorCodes(draft('09:00', '10:00'))).toEqual([])
      expect(errorCodes(draft('17:00', '18:00'))).toEqual([])
    })

    it('rejects a start before 09:00 on the start field', () => {
      const [error] = validateBooking(draft('08:45', '09:30'), [], NOW)
      expect(error).toMatchObject({ code: 'OUTSIDE_WORKING_HOURS', field: 'start' })
    })

    it('rejects an end after 18:00 on the end field', () => {
      const [error] = validateBooking(draft('17:30', '18:15'), [], NOW)
      expect(error).toMatchObject({ code: 'OUTSIDE_WORKING_HOURS', field: 'end' })
    })
  })

  describe('start < end', () => {
    it('rejects start equal to end', () => {
      expect(errorCodes(draft('10:00', '10:00'))).toEqual(['START_NOT_BEFORE_END'])
    })

    it('rejects start after end, without also reporting TOO_SHORT', () => {
      expect(errorCodes(draft('11:00', '10:00'))).toEqual(['START_NOT_BEFORE_END'])
    })
  })

  describe('duration', () => {
    it('accepts exactly 30 minutes', () => {
      expect(errorCodes(draft('10:00', '10:30'))).toEqual([])
    })

    it('rejects 29 minutes', () => {
      expect(errorCodes(draft('10:00', '10:29'))).toEqual(['TOO_SHORT'])
    })

    it('accepts exactly 2 hours', () => {
      expect(errorCodes(draft('10:00', '12:00'))).toEqual([])
    })

    it('rejects 2 hours and 1 minute', () => {
      expect(errorCodes(draft('10:00', '12:01'))).toEqual(['TOO_LONG'])
    })
  })

  describe('overlap', () => {
    const existing: Booking[] = [{ id: 'a', date: TOMORROW, start: '10:00', end: '11:00' }]

    it('allows touching on either side', () => {
      expect(errorCodes(draft('11:00', '12:00'), existing)).toEqual([])
      expect(errorCodes(draft('09:00', '10:00'), existing)).toEqual([])
    })

    it.each([
      ['partial overlap at the start', '09:30', '10:30'],
      ['partial overlap at the end', '10:30', '11:30'],
      ['contained inside', '10:15', '10:45'],
      ['containing', '09:30', '11:30'],
      ['identical', '10:00', '11:00'],
    ])('rejects %s', (_, start, end) => {
      expect(errorCodes(draft(start, end), existing)).toEqual(['OVERLAP'])
    })

    it('ignores bookings on other dates', () => {
      const otherDay: Booking[] = [{ id: 'b', date: '2026-10-29', start: '10:00', end: '11:00' }]
      expect(errorCodes(draft('10:00', '11:00'), otherDay)).toEqual([])
    })
  })

  describe('past dates and times', () => {
    it('rejects a past date on the date field', () => {
      const [error] = validateBooking(draft('10:00', '11:00', YESTERDAY), [], NOW)
      expect(error).toMatchObject({ code: 'IN_THE_PAST', field: 'date' })
    })

    it('rejects a start time that has passed today on the start field', () => {
      const [error] = validateBooking(draft('11:30', '12:30', TODAY), [], NOW)
      expect(error).toMatchObject({ code: 'IN_THE_PAST', field: 'start' })
    })

    it('allows a start in the current minute today', () => {
      expect(errorCodes(draft('12:00', '13:00', TODAY))).toEqual([])
    })

    it('allows a later time today', () => {
      expect(errorCodes(draft('14:00', '15:00', TODAY))).toEqual([])
    })
  })

  describe('editing', () => {
    const existing: Booking[] = [
      { id: 'a', date: TOMORROW, start: '10:00', end: '11:00' },
      { id: 'b', date: TOMORROW, start: '13:00', end: '14:00' },
    ]

    it('is valid when the time is unchanged', () => {
      expect(errorCodes(draft('10:00', '11:00'), existing, 'a')).toEqual([])
    })

    it('excludes itself from the overlap check when moved', () => {
      expect(errorCodes(draft('10:30', '11:30'), existing, 'a')).toEqual([])
    })

    it('still detects overlaps with other bookings', () => {
      expect(errorCodes(draft('12:30', '13:30'), existing, 'a')).toEqual(['OVERLAP'])
    })
  })

  it('reports every broken rule at once', () => {
    expect(errorCodes(draft('08:00', '18:30', YESTERDAY))).toEqual([
      'OUTSIDE_WORKING_HOURS',
      'OUTSIDE_WORKING_HOURS',
      'TOO_LONG',
      'IN_THE_PAST',
    ])
  })
})

describe('isOverlapping', () => {
  it('uses half-open intervals', () => {
    const tenToEleven = { startMinutes: 600, endMinutes: 660 }
    expect(isOverlapping(tenToEleven, { startMinutes: 660, endMinutes: 720 })).toBe(false)
    expect(isOverlapping(tenToEleven, { startMinutes: 659, endMinutes: 720 })).toBe(true)
  })
})

describe('hasStarted', () => {
  it('is true for bookings that started earlier today or on a past day', () => {
    expect(hasStarted({ date: TODAY, start: '11:00' }, NOW)).toBe(true)
    expect(hasStarted({ date: YESTERDAY, start: '15:00' }, NOW)).toBe(true)
  })

  it('is false for upcoming bookings', () => {
    expect(hasStarted({ date: TODAY, start: '12:00' }, NOW)).toBe(false)
    expect(hasStarted({ date: TOMORROW, start: '09:00' }, NOW)).toBe(false)
  })
})
