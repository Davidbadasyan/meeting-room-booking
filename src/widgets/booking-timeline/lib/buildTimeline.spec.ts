import { describe, expect, it } from 'vitest'
import type { Booking } from '@/entities/booking'
import {
  bookingStatus,
  buildTimeline,
  type TimelineSegment,
} from '@/widgets/booking-timeline/lib/buildTimeline'

// Local time: 2026-10-27 12:10
const NOW = new Date(2026, 9, 27, 12, 10)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'
const YESTERDAY = '2026-10-26'

function describeSegments(segments: TimelineSegment[]): string[] {
  return segments.map((segment) => {
    if (segment.kind === 'booking')
      return `booking ${segment.booking.start}-${segment.booking.end} ${segment.status}`
    return `${segment.state} ${segment.start}-${segment.end}`
  })
}

describe('buildTimeline', () => {
  it('splits an empty future day into 30-minute bookable slots from 09:00 to 18:00', () => {
    const segments = buildTimeline(TOMORROW, [], NOW)
    expect(segments).toHaveLength(18)
    expect(describeSegments(segments).slice(0, 2)).toEqual([
      'bookable 09:00-09:30',
      'bookable 09:30-10:00',
    ])
    expect(describeSegments(segments)[segments.length - 1]).toBe('bookable 17:30-18:00')
  })

  it('places bookings in order; a slot is bookable if 30 minutes fit before the next booking', () => {
    const bookings: Booking[] = [
      { id: 'b', date: TOMORROW, start: '11:00', end: '12:00' },
      { id: 'a', date: TOMORROW, start: '09:45', end: '10:30' },
    ]
    expect(describeSegments(buildTimeline(TOMORROW, bookings, NOW)).slice(0, 5)).toEqual([
      'bookable 09:00-09:30',
      'tooShort 09:30-09:45',
      'booking 09:45-10:30 upcoming',
      'bookable 10:30-11:00',
      'booking 11:00-12:00 upcoming',
    ])
  })

  it('marks a gap shorter than 30 minutes as too short', () => {
    const bookings: Booking[] = [
      { id: 'a', date: TOMORROW, start: '09:00', end: '10:00' },
      { id: 'b', date: TOMORROW, start: '10:15', end: '11:00' },
    ]
    expect(describeSegments(buildTimeline(TOMORROW, bookings, NOW))[1]).toBe('tooShort 10:00-10:15')
  })

  it('collapses past time today into one labelled block and resumes at the next 15-minute step', () => {
    const segments = describeSegments(buildTimeline(TODAY, [], NOW))
    expect(segments.slice(0, 3)).toEqual([
      'past 09:00-12:15',
      'bookable 12:15-12:30',
      'bookable 12:30-13:00',
    ])
  })

  it('shows started bookings today as in progress or ended', () => {
    const bookings: Booking[] = [
      { id: 'a', date: TODAY, start: '09:00', end: '10:00' },
      { id: 'b', date: TODAY, start: '12:00', end: '13:00' },
    ]
    expect(describeSegments(buildTimeline(TODAY, bookings, NOW)).slice(0, 4)).toEqual([
      'booking 09:00-10:00 ended',
      'past 10:00-12:00',
      'booking 12:00-13:00 inProgress',
      'bookable 13:00-13:30',
    ])
  })

  it('lists only the bookings on a past date', () => {
    const bookings: Booking[] = [{ id: 'a', date: YESTERDAY, start: '10:00', end: '11:00' }]
    expect(describeSegments(buildTimeline(YESTERDAY, bookings, NOW))).toEqual([
      'booking 10:00-11:00 ended',
    ])
  })

  it('gives every segment its duration for the desktop timeline', () => {
    const bookings: Booking[] = [{ id: 'a', date: TOMORROW, start: '09:00', end: '11:00' }]
    const [first, second] = buildTimeline(TOMORROW, bookings, NOW)
    expect(first?.durationInMinutes).toBe(120)
    expect(second?.durationInMinutes).toBe(30)
  })
})

describe('bookingStatus', () => {
  it('is upcoming, in progress or ended relative to now', () => {
    expect(bookingStatus({ id: 'a', date: TODAY, start: '12:30', end: '13:00' }, NOW)).toBe(
      'upcoming',
    )
    expect(bookingStatus({ id: 'a', date: TODAY, start: '12:00', end: '13:00' }, NOW)).toBe(
      'inProgress',
    )
    expect(bookingStatus({ id: 'a', date: TODAY, start: '11:00', end: '12:00' }, NOW)).toBe('ended')
    expect(bookingStatus({ id: 'a', date: YESTERDAY, start: '15:00', end: '16:00' }, NOW)).toBe(
      'ended',
    )
  })
})
