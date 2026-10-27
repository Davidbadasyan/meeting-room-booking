import { useMutation } from '@tanstack/vue-query'
import { useBookingsApi, useRefreshBookings, type BookingDraft } from '@/entities/booking'

export function useCreateBooking() {
  const api = useBookingsApi()
  const { refreshBookings, refreshBookingsIfStale } = useRefreshBookings()

  return useMutation({
    mutationFn: (draft: BookingDraft) => api.create(draft),
    onSuccess: refreshBookings,
    // Vue Query awaits this before `mutateAsync` rejects, so the form re-validates against the fresh list.
    onError: refreshBookingsIfStale,
  })
}
