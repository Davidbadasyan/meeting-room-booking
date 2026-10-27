import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSelectedDate } from '@/features/select-date/model/useSelectedDate'
import { mountComposable } from '@/mocks/testing'
import { CLOCK_TICK_MS } from '@/shared/config'

// Local time: 2026-10-27 23:59
const BEFORE_MIDNIGHT = new Date(2026, 9, 27, 23, 59)
const AFTER_MIDNIGHT = new Date(2026, 9, 28, 0, 1)

let currentTime = BEFORE_MIDNIGHT
let unmount = () => {}

function mountSelectedDate(search: string) {
  window.history.replaceState(null, '', `/${search}`)
  const mounted = mountComposable(useSelectedDate, () => currentTime)
  unmount = mounted.unmount
  return mounted.result
}

function passMidnight() {
  currentTime = AFTER_MIDNIGHT
  vi.advanceTimersByTime(CLOCK_TICK_MS)
}

beforeEach(() => {
  vi.useFakeTimers()
  currentTime = BEFORE_MIDNIGHT
})
afterEach(() => {
  unmount()
  vi.useRealTimers()
})

describe('useSelectedDate', () => {
  it('defaults to today and keeps ?date out of the URL', () => {
    const { selectedDate } = mountSelectedDate('')
    expect(selectedDate.value).toBe('2026-10-27')
    expect(window.location.search).toBe('')
  })

  it('reads ?date from the URL', () => {
    const { selectedDate, isPast } = mountSelectedDate('?date=2026-10-20')
    expect(selectedDate.value).toBe('2026-10-20')
    expect(isPast.value).toBe(true)
  })

  it('falls back to today for an invalid ?date and cleans the URL, keeping other flags', () => {
    const { selectedDate } = mountSelectedDate('?date=2026-02-30&slow=1')
    expect(selectedDate.value).toBe('2026-10-27')
    expect(window.location.search).toBe('?slow=1')
  })

  it('writes a picked date to the URL', async () => {
    const { selectDate, goToNextDay, selectedDate } = mountSelectedDate('')
    selectDate('2026-11-05')
    await vi.waitFor(() => expect(window.location.search).toBe('?date=2026-11-05'))
    goToNextDay()
    expect(selectedDate.value).toBe('2026-11-06')
  })

  it('moves the default to the new day at midnight', () => {
    const { selectedDate, today } = mountSelectedDate('')
    passMidnight()
    expect(today.value).toBe('2026-10-28')
    expect(selectedDate.value).toBe('2026-10-28')
  })

  it('never changes a date the user picked, even if it was today', () => {
    const { selectedDate, selectDate } = mountSelectedDate('')
    selectDate('2026-10-27')
    passMidnight()
    expect(selectedDate.value).toBe('2026-10-27')
  })

  it('"Today" follows today again', () => {
    const { selectedDate, goToToday, goToPreviousDay } = mountSelectedDate('?date=2026-10-20')
    goToPreviousDay()
    expect(selectedDate.value).toBe('2026-10-19')
    goToToday()
    passMidnight()
    expect(selectedDate.value).toBe('2026-10-28')
  })
})
