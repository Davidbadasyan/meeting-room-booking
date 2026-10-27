import { toValue, type MaybeRefOrGetter } from 'vue'
import type { Booking, BookingDraft } from '@/entities/booking'
import { useCreateBooking } from '@/features/booking-form/api/useCreateBooking'
import { useUpdateBooking } from '@/features/booking-form/api/useUpdateBooking'

/** Creates a new booking, or updates `editingId` when there is one. */
export function useSaveBooking(editingId: MaybeRefOrGetter<string | undefined>) {
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()

  function saveBooking(draft: BookingDraft): Promise<Booking> {
    const id = toValue(editingId)
    if (id === undefined) return createBooking.mutateAsync(draft)

    return updateBooking.mutateAsync({ id, draft })
  }

  return { saveBooking }
}
