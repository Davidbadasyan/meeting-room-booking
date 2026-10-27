import { describe, expect, it } from 'vitest'
import type { Booking } from '@/entities/booking'
import { createBookingStore, type Persistence } from '@/mocks/store'

const SEED: Booking[] = [{ id: 'seed', date: '2026-10-28', start: '10:00', end: '11:00' }]
const OTHER_TAB: Booking[] = [{ id: 'other', date: '2026-10-28', start: '12:00', end: '13:00' }]

/** In-memory persistence that lets the test play "the other tab". */
function createFakePersistence(saved?: Booking[]) {
  let listener: (saved: Booking[] | undefined) => void = () => {}
  let lastSaved = saved
  const persistence: Persistence = {
    load: () => lastSaved,
    save: (bookings) => {
      lastSaved = bookings
    },
    clear: () => {
      lastSaved = undefined
    },
    onExternalChange: (onChange) => {
      listener = onChange
    },
  }
  return { persistence, otherTabWrites: (bookings: Booking[] | undefined) => listener(bookings) }
}

/** One storage shared by two stores, without `storage` events: the race between two tabs. */
function createSharedStorage(): Persistence {
  let saved: Booking[] | undefined
  return {
    load: () => saved,
    save: (bookings) => {
      saved = bookings
    },
    clear: () => {
      saved = undefined
    },
    onExternalChange: () => {},
  }
}

describe('createBookingStore', () => {
  it('keeps bookings written by another tab that has not been announced yet', () => {
    const storage = createSharedStorage()
    const tabA = createBookingStore([], storage)
    const tabB = createBookingStore([], storage)

    tabA.insert({ date: '2026-10-28', start: '10:00', end: '11:00' })
    tabB.insert({ date: '2026-10-28', start: '12:00', end: '13:00' })

    expect(storage.load()?.map((booking) => booking.start)).toEqual(['10:00', '12:00'])
  })

  it('starts from saved bookings when there are any, otherwise from the seed', () => {
    expect(createBookingStore(SEED, createFakePersistence(OTHER_TAB).persistence).all()).toEqual(
      OTHER_TAB,
    )
    expect(createBookingStore(SEED, createFakePersistence().persistence).all()).toEqual(SEED)
  })

  it('switches to what another tab saved', () => {
    const { persistence, otherTabWrites } = createFakePersistence()
    const store = createBookingStore(SEED, persistence)

    otherTabWrites(OTHER_TAB)

    expect(store.all()).toEqual(OTHER_TAB)
  })

  it('goes back to the seed when another tab resets the demo data', () => {
    const { persistence, otherTabWrites } = createFakePersistence(OTHER_TAB)
    const store = createBookingStore(SEED, persistence)

    otherTabWrites(undefined)

    expect(store.all()).toEqual(SEED)
  })
})
