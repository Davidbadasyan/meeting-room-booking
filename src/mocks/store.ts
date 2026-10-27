import { addDays } from 'date-fns'
import { toIsoDate, type Booking, type BookingDraft } from '@/domain'

export interface BookingStore {
  all(): Booking[]
  byDate(date: string): Booking[]
  get(id: string): Booking | undefined
  insert(draft: BookingDraft): Booking
  replace(booking: Booking): Booking
  remove(id: string): boolean
}

export interface Persistence {
  load(): Booking[] | undefined
  save(bookings: Booking[]): void
}

export function createBookingStore(seed: Booking[] = [], persistence?: Persistence): BookingStore {
  let bookings: Booking[] = persistence?.load() ?? seed.map((b) => ({ ...b }))

  const commit = (next: Booking[]) => {
    bookings = next
    persistence?.save(bookings)
  }

  return {
    all: () => bookings.map((b) => ({ ...b })),
    byDate: (date) =>
      bookings
        .filter((b) => b.date === date)
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((b) => ({ ...b })),
    get: (id) => {
      const found = bookings.find((b) => b.id === id)
      return found && { ...found }
    },
    insert: (draft) => {
      const booking: Booking = { ...draft, id: crypto.randomUUID() }
      commit([...bookings, booking])
      return { ...booking }
    },
    replace: (booking) => {
      commit(bookings.map((b) => (b.id === booking.id ? { ...booking } : b)))
      return { ...booking }
    },
    remove: (id) => {
      const next = bookings.filter((b) => b.id !== id)
      if (next.length === bookings.length) return false
      commit(next)
      return true
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

/** localStorage can be missing or throw (private mode, blocked storage); fall back to memory. */
export const localStoragePersistence: Persistence = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Booking[]) : undefined
    } catch {
      return undefined
    }
  },
  save(bookings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch {
      // Persistence is a convenience; the in-memory store still works.
    }
  },
}
