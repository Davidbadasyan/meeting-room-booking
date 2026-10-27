import { addDays, format, isValid, parse } from 'date-fns'
import { MINUTES_PER_HOUR, timeToMinutes, type Time } from '@/shared/lib/time/time'

/** Calendar date in the user's local timezone, `YYYY-MM-DD`. */
export type IsoDate = string

const ISO_DATE_FORMAT = 'yyyy-MM-dd'

/**
 * True for real calendar dates in `YYYY-MM-DD` form.
 * Formatting the parsed date back rejects both bad formats and days like 2026-02-30.
 */
export function isRealDate(value: string): boolean {
  const parsed = parse(value, ISO_DATE_FORMAT, new Date(0))
  if (!isValid(parsed)) return false
  return format(parsed, ISO_DATE_FORMAT) === value
}

export function toIsoDate(now: Date): IsoDate {
  return format(now, ISO_DATE_FORMAT)
}

function toLocalDate(date: IsoDate): Date {
  return parse(date, ISO_DATE_FORMAT, new Date(0))
}

/** Calendar arithmetic in local time, so it is right across DST changes too. */
export function addDaysToIsoDate(date: IsoDate, days: number): IsoDate {
  return toIsoDate(addDays(toLocalDate(date), days))
}

/** For headings and dialog descriptions, e.g. "Tuesday, 27 October 2026". */
export function formatLongDate(date: IsoDate): string {
  return format(toLocalDate(date), 'EEEE, d MMMM yyyy')
}

export function nowInMinutes(now: Date): number {
  return now.getHours() * MINUTES_PER_HOUR + now.getMinutes()
}

/** ISO dates sort the same way as strings, so a string comparison is enough. */
export function isPastDate(date: IsoDate, now: Date): boolean {
  return date < toIsoDate(now)
}

/** Starting in the current minute still counts as not past. */
export function isPastTime(date: IsoDate, time: Time, now: Date): boolean {
  if (isPastDate(date, now)) return true
  if (date !== toIsoDate(now)) return false
  return timeToMinutes(time) < nowInMinutes(now)
}
