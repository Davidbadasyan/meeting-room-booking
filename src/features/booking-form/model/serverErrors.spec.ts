import { describe, expect, it } from 'vitest'
import { splitServerErrors } from '@/features/booking-form/model/serverErrors'

describe('splitServerErrors', () => {
  it('puts details under the form fields they name', () => {
    const result = splitServerErrors([
      { code: 'IN_THE_PAST', field: 'start', message: 'You cannot book time in the past' },
      { code: 'TOO_LONG', field: 'end', message: 'Maximum duration is 2 hours' },
    ])
    expect(result).toEqual({
      fieldErrors: {
        start: 'You cannot book time in the past',
        end: 'Maximum duration is 2 hours',
      },
      otherMessages: [],
    })
  })

  it('keeps details without a known field as general messages', () => {
    const result = splitServerErrors([
      { code: 'ROOM_CLOSED', field: 'room', message: 'The room is closed' },
      { code: 'UNKNOWN', message: 'Try later' },
    ])
    expect(result).toEqual({ fieldErrors: {}, otherMessages: ['The room is closed', 'Try later'] })
  })
})
