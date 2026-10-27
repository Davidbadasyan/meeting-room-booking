import { format, isValid, parse } from 'date-fns'
import { SLOT_STEP, WORK_END, WORK_START } from './constants'
import type { IsoDate, Time } from './types'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidTime(value: unknown): value is Time {
  return typeof value === 'string' && TIME_RE.test(value)
}

export function isValidDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  // Round-trip rejects things like 2026-02-30.
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value
}

export function timeToMinutes(time: Time): number {
  if (!isValidTime(time)) throw new Error(`Invalid time: ${String(time)}`)
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}

export function minutesToTime(minutes: number): Time {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) {
    throw new Error(`Minutes out of range: ${minutes}`)
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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

/** All picker values from `from` to `to` inclusive, `step` minutes apart. */
export function generateTimeOptions(
  from: Time = WORK_START,
  to: Time = WORK_END,
  step: number = SLOT_STEP,
): Time[] {
  const options: Time[] = []
  for (let m = timeToMinutes(from); m <= timeToMinutes(to); m += step) {
    options.push(minutesToTime(m))
  }
  return options
}
