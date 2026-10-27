import { MAX_DURATION, MIN_DURATION, WORK_END, WORK_START } from './constants'
import { isPastDate, isPastTime, isValidDate, isValidTime, timeToMinutes } from './time'
import type { Booking, BookingDraft, BookingError } from './types'

/** Half-open intervals: touching boundaries (10:00–11:00 and 11:00–12:00) do not overlap. */
export function overlaps(a: Pick<Booking, 'start' | 'end'>, b: Pick<Booking, 'start' | 'end'>) {
  return (
    timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end)
  )
}

export function findConflict(
  draft: BookingDraft,
  existing: readonly Booking[],
  editingId?: string,
): Booking | undefined {
  return existing.find((b) => b.id !== editingId && b.date === draft.date && overlaps(draft, b))
}

/**
 * Checks every business rule for a draft. Pure: `now` is injected so the result
 * is deterministic and the same function runs in the UI and the mock server.
 *
 * Returns an empty array when the draft is valid.
 */
export function validateBooking(
  draft: BookingDraft,
  existing: readonly Booking[],
  now: Date,
  editingId?: string,
): BookingError[] {
  const errors: BookingError[] = []

  const dateOk = isValidDate(draft.date)
  const startOk = isValidTime(draft.start)
  const endOk = isValidTime(draft.end)

  if (!dateOk) {
    errors.push({ code: 'INVALID_DATE', field: 'date', message: 'Enter a valid date.' })
  }
  if (!startOk) {
    errors.push({ code: 'INVALID_TIME', field: 'start', message: 'Enter a valid start time.' })
  }
  if (!endOk) {
    errors.push({ code: 'INVALID_TIME', field: 'end', message: 'Enter a valid end time.' })
  }
  if (!startOk || !endOk) return errors

  const start = timeToMinutes(draft.start)
  const end = timeToMinutes(draft.end)
  const dayStart = timeToMinutes(WORK_START)
  const dayEnd = timeToMinutes(WORK_END)

  if (start < dayStart || start > dayEnd) {
    errors.push({
      code: 'OUTSIDE_WORKING_HOURS',
      field: 'start',
      message: `Start must be between ${WORK_START} and ${WORK_END}.`,
    })
  }
  if (end < dayStart || end > dayEnd) {
    errors.push({
      code: 'OUTSIDE_WORKING_HOURS',
      field: 'end',
      message: `End must be between ${WORK_START} and ${WORK_END}.`,
    })
  }

  if (start >= end) {
    errors.push({
      code: 'START_NOT_BEFORE_END',
      field: 'end',
      message: 'End time must be after start time.',
    })
  } else {
    const duration = end - start
    if (duration < MIN_DURATION) {
      errors.push({
        code: 'TOO_SHORT',
        field: 'end',
        message: `A booking must be at least ${MIN_DURATION} minutes.`,
      })
    }
    if (duration > MAX_DURATION) {
      errors.push({
        code: 'TOO_LONG',
        field: 'end',
        message: `A booking can be at most ${MAX_DURATION / 60} hours.`,
      })
    }
  }

  if (!dateOk) return errors

  if (isPastDate(draft.date, now)) {
    errors.push({ code: 'PAST_DATE', field: 'date', message: 'You cannot book a past date.' })
  } else if (isPastTime(draft.date, draft.start, now)) {
    errors.push({ code: 'PAST_TIME', field: 'start', message: 'Start time has already passed.' })
  }

  // Only meaningful for a well-formed interval.
  if (start < end) {
    const conflict = findConflict(draft, existing, editingId)
    if (conflict) {
      errors.push({
        code: 'OVERLAP',
        field: 'start',
        message: `Overlaps with an existing booking (${conflict.start}–${conflict.end}).`,
        conflictWith: conflict,
      })
    }
  }

  return errors
}
