import { MAX_DURATION, MIN_DURATION, SLOT_STEP, WORK_END, WORK_START } from '@/entities/booking'
import {
  generateTimeOptions,
  isPastTime,
  MINUTES_PER_HOUR,
  minutesToTime,
  timeToMinutes,
  type IsoDate,
  type Time,
} from '@/shared/lib/time'
import type { SelectOption } from '@/shared/ui'

const latestStart = minutesToTime(timeToMinutes(WORK_END) - MIN_DURATION)

/** "30 min", "1 h", "1 h 45 min". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

/** 09:00 to 17:30 on the slot grid; for today, times that have passed are disabled. */
export function startTimeOptions(date: IsoDate, now: Date): SelectOption<Time>[] {
  return generateTimeOptions(WORK_START, latestStart, SLOT_STEP).map((time) => ({
    value: time,
    label: time,
    isDisabled: isPastTime(date, time, now),
  }))
}

/** From start + 30 min to start + 2 h, never past 18:00. Empty until a start is chosen. */
export function endTimeOptions(start: Time | ''): SelectOption<Time>[] {
  if (start === '') return []

  const startMinutes = timeToMinutes(start)
  const earliest = minutesToTime(startMinutes + MIN_DURATION)
  const latest = minutesToTime(Math.min(startMinutes + MAX_DURATION, timeToMinutes(WORK_END)))
  return generateTimeOptions(earliest, latest, SLOT_STEP).map((time) => ({
    value: time,
    label: `${time} (${formatDuration(timeToMinutes(time) - startMinutes)})`,
  }))
}
