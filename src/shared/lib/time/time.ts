/** Wall-clock time, `HH:mm` (24h). */
export type Time = string

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidTime(value: unknown): value is Time {
  return typeof value === 'string' && TIME_RE.test(value)
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

/** All times from `from` to `to` inclusive, `step` minutes apart. */
export function generateTimeOptions(from: Time, to: Time, step: number): Time[] {
  const options: Time[] = []
  for (let m = timeToMinutes(from); m <= timeToMinutes(to); m += step) {
    options.push(minutesToTime(m))
  }
  return options
}
