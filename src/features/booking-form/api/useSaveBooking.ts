import { toValue, type MaybeRefOrGetter } from 'vue'
import type { Booking, BookingDraft } from '@/entities/booking'
import { useCreateBooking } from '@/features/booking-form/api/useCreateBooking'
import { useUpdateBooking } from '@/features/booking-form/api/useUpdateBooking'

/** `saveBooking` creates, or updates `editingId` when there is one; `createBooking` always creates. */
export function useSaveBooking(editingId: MaybeRefOrGetter<string | undefined>) {
  const createBookingMutation = useCreateBooking()
  const updateBooking = useUpdateBooking()

  function saveBooking(draft: BookingDraft): Promise<Booking> {
    const id = toValue(editingId)
    if (id === undefined) return createBookingMutation.mutateAsync(draft)

    return updateBooking.mutateAsync({ id, draft })
  }

  function createBooking(draft: BookingDraft): Promise<Booking> {
    return createBookingMutation.mutateAsync(draft)
  }

  return { saveBooking, createBooking }
}
