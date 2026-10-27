import { addDays } from 'date-fns'
import { z } from 'zod'
import { bookingDtoSchema, type Booking, type BookingDraft } from '@/entities/booking'
import { toIsoDate } from '@/shared/lib/time'

export interface BookingStore {
  all(): Booking[]
  byDate(date: string): Booking[]
  get(id: string): Booking | undefined
  insert(draft: BookingDraft): Booking
  replace(booking: Booking): Booking
  remove(id: string): void
}

export interface Persistence {
  load(): Booking[] | undefined
  save(bookings: Booking[]): void
  clear(): void
  /** Called when another tab changes the saved bookings; `undefined` means they were cleared. */
  onExternalChange(listener: (saved: Booking[] | undefined) => void): void
}

export function createBookingStore(seed: Booking[] = [], persistence?: Persistence): BookingStore {
  let bookings = persistence?.load() ?? seed

  function commit(next: Booking[]) {
    bookings = next
    persistence?.save(bookings)
  }

  /** Another tab may have written since our last `storage` event; never write over its changes. */
  function latest(): Booking[] {
    return persistence?.load() ?? bookings
  }

  // Another tab saved or reset the bookings: use its version, so two tabs act like two users.
  persistence?.onExternalChange((saved) => {
    bookings = saved ?? seed
  })

  return {
    all: () => bookings,
    byDate: (date) =>
      bookings
        .filter((booking) => booking.date === date)
        .sort((a, b) => a.start.localeCompare(b.start)),
    get: (id) => bookings.find((booking) => booking.id === id),
    insert: (draft) => {
      const booking = { ...draft, id: crypto.randomUUID() }
      commit([...latest(), booking])
      return booking
    },
    replace: (updated) => {
      commit(latest().map((booking) => (booking.id === updated.id ? updated : booking)))
      return updated
    },
    remove: (id) => {
      commit(latest().filter((booking) => booking.id !== id))
    },
  }
}

/** A few bookings around `now` so the app isn't empty on first load. */
export function createSeed(now: Date): Booking[] {
  const today = toIsoDate(now)
  const tomorrow = toIsoDate(addDays(now, 1))
  const yesterday = toIsoDate(addDays(now, -1))
  return [
    { id: 'seed-1', date: yesterday, start: '10:00', end: '11:00', title: 'Retro' },
    { id: 'seed-2', date: today, start: '09:30', end: '10:00', title: 'Daily standup' },
    { id: 'seed-3', date: today, start: '14:00', end: '15:30', title: 'Design review' },
    { id: 'seed-4', date: tomorrow, start: '11:00', end: '12:00', title: 'Client call' },
    { id: 'seed-5', date: tomorrow, start: '15:00', end: '17:00' },
  ]
}

const STORAGE_KEY = 'mrb:bookings'
const savedBookingsSchema = z.array(bookingDtoSchema)

function loadSavedBookings(): Booking[] | undefined {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return undefined
    const result = savedBookingsSchema.safeParse(JSON.parse(saved))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

/** localStorage can be missing or throw (private mode, blocked storage); then we stay in memory. */
export const localStoragePersistence: Persistence = {
  load: loadSavedBookings,
  save(bookings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch {
      // Saving is a convenience; the in-memory store keeps working.
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing saved, nothing to clear.
    }
  },
  onExternalChange(listener) {
    // The `storage` event only fires in the other tabs, never in the one that wrote.
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return
      listener(loadSavedBookings())
    })
  },
}
