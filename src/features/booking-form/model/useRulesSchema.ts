import { toTypedSchema } from '@vee-validate/zod'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useBookingsQuery } from '@/entities/booking'
import { createBookingFormSchema } from '@/features/booking-form/model/schema'
import { useNow } from '@/shared/lib/clock'
import type { IsoDate } from '@/shared/lib/time'

/** The form schema, rebuilt whenever the day's bookings or the clock change. */
export function useRulesSchema(
  date: MaybeRefOrGetter<IsoDate>,
  editingId: MaybeRefOrGetter<string | undefined>,
) {
  const { now } = useNow()
  const { data: bookings } = useBookingsQuery(date)

  return computed(() => {
    const context = {
      existing: bookings.value ?? [],
      now: now.value,
      editingId: toValue(editingId),
    }
    return toTypedSchema(createBookingFormSchema(context))
  })
}
