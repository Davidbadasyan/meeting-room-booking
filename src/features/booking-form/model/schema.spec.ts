import { describe, expect, it } from 'vitest'
import type { Booking } from '@/entities/booking'
import {
  createBookingFormSchema,
  toDraft,
  toFormValues,
} from '@/features/booking-form/model/schema'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const TOMORROW = '2026-10-28'
const PLANNING: Booking = { id: 'a', date: TOMORROW, start: '10:00', end: '11:00' }
const EXISTING = [PLANNING]

function issuesFor(values: { start: string; end: string; title?: string }, editingId?: string) {
  const schema = createBookingFormSchema({ existing: EXISTING, now: NOW, editingId })
  const result = schema.safeParse({ date: TOMORROW, title: '', ...values })
  if (result.success) return []
  return result.error.issues.map((issue) => ({ field: issue.path[0], message: issue.message }))
}

describe('createBookingFormSchema', () => {
  it('accepts a valid slot', () => {
    expect(issuesFor({ start: '12:00', end: '13:00' })).toEqual([])
  })

  it('asks for missing times and skips the business rules until they are filled in', () => {
    expect(issuesFor({ start: '', end: '' })).toEqual([
      { field: 'start', message: 'Choose a start time' },
      { field: 'end', message: 'Choose an end time' },
    ])
  })

  it('reports business rules on the field they belong to', () => {
    expect(issuesFor({ start: '10:30', end: '11:30' })).toEqual([
      { field: 'start', message: 'This time overlaps another booking' },
    ])
    expect(issuesFor({ start: '12:00', end: '12:15' })).toEqual([
      { field: 'end', message: 'Minimum duration is 30 minutes' },
    ])
  })

  it('lets the edited booking keep its own slot', () => {
    expect(issuesFor({ start: '10:00', end: '11:00' }, 'a')).toEqual([])
  })
})

describe('toFormValues / toDraft', () => {
  it('starts a new booking empty on the given date', () => {
    expect(toFormValues(TOMORROW)).toEqual({ date: TOMORROW, start: '', end: '', title: '' })
  })

  it('prefills an existing booking', () => {
    expect(toFormValues('2026-11-01', { ...PLANNING, title: 'Sync' })).toEqual({
      date: TOMORROW,
      start: '10:00',
      end: '11:00',
      title: 'Sync',
    })
  })

  it('turns form values into a draft', () => {
    const values = { date: TOMORROW, start: '12:00', end: '13:00', title: 'Lunch' }
    expect(toDraft(values)).toEqual(values)
  })
})
