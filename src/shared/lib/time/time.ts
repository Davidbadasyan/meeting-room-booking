/** Wall-clock time, `HH:mm` (24h). */
export type Time = string

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const MINUTES_PER_HOUR = 60

export function timeToMinutes(time: Time): number {
  const hours = Number(time.slice(0, 2))
  const minutes = Number(time.slice(3, 5))
  return hours * MINUTES_PER_HOUR + minutes
}

export function minutesToTime(totalMinutes: number): Time {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  return `${twoDigits(hours)}:${twoDigits(minutes)}`
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/** All times from `from` to `to` inclusive, `stepInMinutes` apart. */
export function generateTimeOptions(from: Time, to: Time, stepInMinutes: number): Time[] {
  const options: Time[] = []
  for (let minutes = timeToMinutes(from); minutes <= timeToMinutes(to); minutes += stepInMinutes) {
    options.push(minutesToTime(minutes))
  }
  return options
}
