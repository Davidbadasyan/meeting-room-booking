import { useMutation } from '@tanstack/vue-query'
import { useBookingsApi, useRefreshBookings, type BookingDraft } from '@/entities/booking'

export interface UpdateBookingInput {
  id: string
  draft: BookingDraft
}

export function useUpdateBooking() {
  const api = useBookingsApi()
  const { refreshBookingsInBackground, refreshBookingsIfStale } = useRefreshBookings()

  return useMutation({
    mutationFn: ({ id, draft }: UpdateBookingInput) => api.update(id, draft),
    // Not awaited: the dialog closes and the toast shows right away.
    onSuccess: refreshBookingsInBackground,
    // Awaited by Vue Query before `mutateAsync` rejects, so the form re-validates against the fresh list.
    onError: refreshBookingsIfStale,
  })
}
