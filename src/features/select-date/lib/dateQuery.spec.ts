import { describe, expect, it } from 'vitest'
import { readDateParam, withDateParam } from '@/features/select-date/lib/dateQuery'

describe('readDateParam', () => {
  it('reads a valid date', () => {
    expect(readDateParam('?date=2026-10-28')).toBe('2026-10-28')
  })

  it.each(['', '?date=', '?date=tomorrow', '?date=2026-02-30', '?date=2026-1-5'])(
    'ignores a missing or invalid date: "%s"',
    (search) => {
      expect(readDateParam(search)).toBeUndefined()
    },
  )
})

describe('withDateParam', () => {
  it('sets the date and keeps other parameters', () => {
    expect(withDateParam('?slow=1', '2026-10-28')).toBe('?slow=1&date=2026-10-28')
    expect(withDateParam('?date=2026-01-01', '2026-10-28')).toBe('?date=2026-10-28')
  })

  it('removes the date when it is undefined', () => {
    expect(withDateParam('?date=2026-10-28&slow=1', undefined)).toBe('?slow=1')
    expect(withDateParam('?date=2026-10-28', undefined)).toBe('')
  })
})
