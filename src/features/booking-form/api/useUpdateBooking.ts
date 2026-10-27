import { useMutation } from '@tanstack/vue-query'
import { useBookingsApi, useRefreshBookings, type BookingDraft } from '@/entities/booking'

export interface UpdateBookingInput {
  id: string
  draft: BookingDraft
}

export function useUpdateBooking() {
  const api = useBookingsApi()
  const { refreshBookings, refreshBookingsIfStale } = useRefreshBookings()

  return useMutation({
    mutationFn: ({ id, draft }: UpdateBookingInput) => api.update(id, draft),
    onSuccess: refreshBookings,
    // Vue Query awaits this before `mutateAsync` rejects, so the form re-validates against the fresh list.
    onError: refreshBookingsIfStale,
  })
}
