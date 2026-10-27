import { useMutation } from '@tanstack/vue-query'
import { useBookingsApi, useRefreshBookings, type BookingDraft } from '@/entities/booking'

export function useCreateBooking() {
  const api = useBookingsApi()
  const { refreshBookingsInBackground, refreshBookingsIfStale } = useRefreshBookings()

  return useMutation({
    mutationFn: (draft: BookingDraft) => api.create(draft),
    // Not awaited: the dialog closes and the toast shows right away.
    onSuccess: refreshBookingsInBackground,
    // Awaited by Vue Query before `mutateAsync` rejects, so the form re-validates against the fresh list.
    onError: refreshBookingsIfStale,
  })
}
