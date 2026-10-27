import {
  hasStarted,
  MIN_DURATION,
  SLOT_STEP,
  WORK_END,
  WORK_START,
  type Booking,
} from '@/entities/booking'
import { FREE_SLOT_MINUTES } from '@/widgets/booking-timeline/config/timeline'
import {
  isPastDate,
  isPastTime,
  minutesToTime,
  nowInMinutes,
  timeToMinutes,
  toIsoDate,
  type IsoDate,
  type Time,
} from '@/shared/lib/time'

export type BookingStatus = 'upcoming' | 'inProgress' | 'ended'

/** `past`: already gone; `bookable`: click to book; `tooShort`: free, but under the minimum duration. */
export type FreeTimeState = 'past' | 'bookable' | 'tooShort'

export interface BookingSegment {
  kind: 'booking'
  booking: Booking
  status: BookingStatus
  durationInMinutes: number
}

export interface FreeSegment {
  kind: 'free'
  start: Time
  end: Time
  state: FreeTimeState
  durationInMinutes: number
}

export type TimelineSegment = BookingSegment | FreeSegment

const workdayStart = timeToMinutes(WORK_START)
const workdayEnd = timeToMinutes(WORK_END)

function roundUpToStep(minutes: number, step: number): number {
  return Math.ceil(minutes / step) * step
}

function nextFreeSlotBoundary(minutes: number): number {
  return (Math.floor(minutes / FREE_SLOT_MINUTES) + 1) * FREE_SLOT_MINUTES
}

/** Earliest bookable minute: the next picker step from now today, the start of the day otherwise. */
function firstBookableMinute(date: IsoDate, now: Date): number {
  if (date !== toIsoDate(now)) return workdayStart
  return roundUpToStep(nowInMinutes(now), SLOT_STEP)
}

export function bookingStatus(booking: Booking, now: Date): BookingStatus {
  if (isPastTime(booking.date, booking.end, now)) return 'ended'
  if (hasStarted(booking, now)) return 'inProgress'
  return 'upcoming'
}

function freeSegment(start: number, end: number, state: FreeTimeState): FreeSegment {
  return {
    kind: 'free',
    start: minutesToTime(start),
    end: minutesToTime(end),
    state,
    durationInMinutes: end - start,
  }
}

/** Free time between two bookings: one "past" block, then 30-minute slots on the grid. */
function freeSegmentsBetween(from: number, to: number, bookableFrom: number): FreeSegment[] {
  const segments: FreeSegment[] = []
  const pastUntil = Math.min(to, Math.max(from, bookableFrom))
  if (from < pastUntil) segments.push(freeSegment(from, pastUntil, 'past'))

  for (let start = pastUntil; start < to; start = nextFreeSlotBoundary(start)) {
    const end = Math.min(nextFreeSlotBoundary(start), to)
    const isLongEnough = to - start >= MIN_DURATION
    segments.push(freeSegment(start, end, isLongEnough ? 'bookable' : 'tooShort'))
  }
  return segments
}

function bookingSegment(booking: Booking, now: Date): BookingSegment {
  const durationInMinutes = timeToMinutes(booking.end) - timeToMinutes(booking.start)
  return { kind: 'booking', booking, status: bookingStatus(booking, now), durationInMinutes }
}

/**
 * The working day as an ordered list of bookings and free time. Past dates only list their
 * bookings: nothing there can be booked, so free time would only be noise.
 */
export function buildTimeline(date: IsoDate, bookings: Booking[], now: Date): TimelineSegment[] {
  const sorted = [...bookings].sort((a, b) => a.start.localeCompare(b.start))
  if (isPastDate(date, now)) return sorted.map((booking) => bookingSegment(booking, now))

  const bookableFrom = firstBookableMinute(date, now)
  const segments: TimelineSegment[] = []
  let cursor = workdayStart
  for (const booking of sorted) {
    segments.push(...freeSegmentsBetween(cursor, timeToMinutes(booking.start), bookableFrom))
    segments.push(bookingSegment(booking, now))
    cursor = Math.max(cursor, timeToMinutes(booking.end))
  }
  segments.push(...freeSegmentsBetween(cursor, workdayEnd, bookableFrom))
  return segments
}
