import type { Booking } from '@/entities/booking/model/booking'

const UNTITLED = 'Untitled'

export function formatTimeRange(booking: Pick<Booking, 'start' | 'end'>): string {
  return `${booking.start}–${booking.end}`
}

export function displayTitle(booking: Pick<Booking, 'title'>): string {
  return booking.title ?? UNTITLED
}

/** One-line description for buttons and dialogs, e.g. "10:00–11:00, Planning". */
export function describeBooking(booking: Booking): string {
  return `${formatTimeRange(booking)}, ${displayTitle(booking)}`
}
