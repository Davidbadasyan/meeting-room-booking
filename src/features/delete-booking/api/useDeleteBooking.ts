import { useMutation } from '@tanstack/vue-query'
import { useBookingsApi, useRefreshBookings } from '@/entities/booking'
import type { DeleteOutcome } from '@/features/delete-booking/config/messages'
import { NotFoundError } from '@/shared/api'

/** Deletes a booking. Resolves with what happened; other errors (network, 400) reject as usual. */
export function useDeleteBooking() {
  const api = useBookingsApi()
  const { refreshBookingsInBackground } = useRefreshBookings()

  async function removeBooking(id: string): Promise<DeleteOutcome> {
    try {
      await api.remove(id)
      return 'deleted'
    } catch (error) {
      // The user wanted it gone and it is gone, so treat 404 as done.
      if (error instanceof NotFoundError) return 'alreadyDeleted'
      throw error
    }
  }

  return useMutation({
    mutationFn: removeBooking,
    // Both outcomes change the list. Not awaited: the dialog closes and the toast shows right away.
    onSuccess: refreshBookingsInBackground,
  })
}
