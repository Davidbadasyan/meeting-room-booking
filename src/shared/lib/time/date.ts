import { format, isValid, parse } from 'date-fns'
import { timeToMinutes, type Time } from './time'

/** Calendar date in the user's local timezone, `YYYY-MM-DD`. */
export type IsoDate = string

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  // Round-trip rejects things like 2026-02-30.
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value
}

/** `now` formatted as a local calendar date. */
export function toIsoDate(now: Date): IsoDate {
  return format(now, 'yyyy-MM-dd')
}

/** Minutes since local midnight for `now`. */
export function nowInMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

/** True if `date` is before today (local time). ISO dates compare correctly as strings. */
export function isPastDate(date: IsoDate, now: Date): boolean {
  return date < toIsoDate(now)
}

/**
 * True if `date` + `time` lies before the current minute.
 * Starting in the current minute is still allowed.
 */
export function isPastTime(date: IsoDate, time: Time, now: Date): boolean {
  const today = toIsoDate(now)
  if (date !== today) return date < today
  return timeToMinutes(time) < nowInMinutes(now)
}
