import {
  isPastDate,
  isPastTime,
  MINUTES_PER_HOUR,
  nowInMinutes,
  timeToMinutes,
  toIsoDate,
} from '@/shared/lib/time'
import {
  MAX_DURATION,
  MIN_DURATION,
  WORK_END,
  WORK_START,
} from '@/entities/booking/config/workingHours'
import type {
  Booking,
  BookingDraft,
  BookingError,
  BookingErrorCode,
  BookingField,
} from '@/entities/booking/model/booking'

const errorMessages: Record<BookingErrorCode, string> = {
  OUTSIDE_WORKING_HOURS: `Booking must be between ${WORK_START} and ${WORK_END}`,
  START_NOT_BEFORE_END: 'End time must be after start time',
  TOO_SHORT: `Minimum duration is ${MIN_DURATION} minutes`,
  TOO_LONG: `Maximum duration is ${MAX_DURATION / MINUTES_PER_HOUR} hours`,
  OVERLAP: 'This time overlaps another booking',
  IN_THE_PAST: 'You cannot book time in the past',
  ALREADY_STARTED: 'A booking that has already started cannot be changed',
}

export function createBookingError(code: BookingErrorCode, field: BookingField): BookingError {
  return { code, field, message: errorMessages[code] }
}

export interface MinuteRange {
  startMinutes: number
  endMinutes: number
}

/** Everything a rule needs, with times already converted to minutes. */
interface RuleInput extends MinuteRange {
  date: string
  durationInMinutes: number
  otherBookingRanges: MinuteRange[]
  now: Date
}

interface Rule {
  code: BookingErrorCode
  field: BookingField
  isSatisfied: (input: RuleInput) => boolean
}

const workdayStartMinutes = timeToMinutes(WORK_START)
const workdayEndMinutes = timeToMinutes(WORK_END)

function startsWithinWorkingHours({ startMinutes }: RuleInput): boolean {
  return startMinutes >= workdayStartMinutes
}

function endsWithinWorkingHours({ endMinutes }: RuleInput): boolean {
  return endMinutes <= workdayEndMinutes
}

function isStartBeforeEnd({ startMinutes, endMinutes }: RuleInput): boolean {
  return startMinutes < endMinutes
}

function isLongEnough({ durationInMinutes }: RuleInput): boolean {
  // A zero or negative duration is already reported by isStartBeforeEnd.
  if (durationInMinutes <= 0) return true
  return durationInMinutes >= MIN_DURATION
}

function isShortEnough({ durationInMinutes }: RuleInput): boolean {
  return durationInMinutes <= MAX_DURATION
}

function isNotOnPastDate({ date, now }: RuleInput): boolean {
  return !isPastDate(date, now)
}

function startsNotEarlierThanNowToday({ date, startMinutes, now }: RuleInput): boolean {
  if (date !== toIsoDate(now)) return true
  return startMinutes >= nowInMinutes(now)
}

function isFreeSlot(input: RuleInput): boolean {
  return !input.otherBookingRanges.some((range) => isOverlapping(input, range))
}

const rules: Rule[] = [
  { code: 'OUTSIDE_WORKING_HOURS', field: 'start', isSatisfied: startsWithinWorkingHours },
  { code: 'OUTSIDE_WORKING_HOURS', field: 'end', isSatisfied: endsWithinWorkingHours },
  { code: 'START_NOT_BEFORE_END', field: 'end', isSatisfied: isStartBeforeEnd },
  { code: 'TOO_SHORT', field: 'end', isSatisfied: isLongEnough },
  { code: 'TOO_LONG', field: 'end', isSatisfied: isShortEnough },
  { code: 'IN_THE_PAST', field: 'date', isSatisfied: isNotOnPastDate },
  { code: 'IN_THE_PAST', field: 'start', isSatisfied: startsNotEarlierThanNowToday },
  { code: 'OVERLAP', field: 'start', isSatisfied: isFreeSlot },
]

/** Half-open intervals: 10:00–11:00 and 11:00–12:00 touch but do not overlap. */
export function isOverlapping(a: MinuteRange, b: MinuteRange): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

function toMinuteRange(booking: Pick<Booking, 'start' | 'end'>): MinuteRange {
  return { startMinutes: timeToMinutes(booking.start), endMinutes: timeToMinutes(booking.end) }
}

/**
 * Checks a draft against every business rule. Returns an empty list when it is valid.
 * `now` is a parameter so the result is deterministic and the mock server can reuse it.
 * When editing, pass `editingId` so the booking does not overlap with itself.
 */
export function validateBooking(
  draft: BookingDraft,
  existing: readonly Booking[],
  now: Date,
  editingId?: string,
): BookingError[] {
  const input = toRuleInput(draft, existing, now, editingId)
  const brokenRules = rules.filter((rule) => !rule.isSatisfied(input))
  return brokenRules.map((rule) => createBookingError(rule.code, rule.field))
}

function toRuleInput(
  draft: BookingDraft,
  existing: readonly Booking[],
  now: Date,
  editingId?: string,
): RuleInput {
  const { startMinutes, endMinutes } = toMinuteRange(draft)
  const otherBookings = existing.filter(
    (booking) => booking.date === draft.date && booking.id !== editingId,
  )
  return {
    date: draft.date,
    startMinutes,
    endMinutes,
    durationInMinutes: endMinutes - startMinutes,
    otherBookingRanges: otherBookings.map(toMinuteRange),
    now,
  }
}

export function hasStarted(booking: Pick<Booking, 'date' | 'start'>, now: Date): boolean {
  return isPastTime(booking.date, booking.start, now)
}
