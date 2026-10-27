import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Booking } from '@/entities/booking'
import { useNow } from '@/shared/lib/clock'
import type { IsoDate } from '@/shared/lib/time'
import { buildTimeline } from '@/widgets/booking-timeline/lib/buildTimeline'

/** The day's timeline segments; past time moves forward as the clock ticks. */
export function useTimelineSlots(
  date: MaybeRefOrGetter<IsoDate>,
  bookings: MaybeRefOrGetter<Booking[]>,
) {
  const { now } = useNow()
  const segments = computed(() => buildTimeline(toValue(date), toValue(bookings), now.value))
  return { segments }
}
