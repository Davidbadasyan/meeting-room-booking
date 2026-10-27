import { computed, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { endTimeOptions, startTimeOptions } from '@/features/booking-form/lib/timeOptions'
import { useNow } from '@/shared/lib/clock'
import type { IsoDate } from '@/shared/lib/time'

interface UseTimeOptionsOptions {
  date: MaybeRefOrGetter<IsoDate>
  start: Ref<string>
  end: Ref<string>
}

/** The start and end choices. When the start changes, an end that is no longer offered is cleared. */
export function useTimeOptions({ date, start, end }: UseTimeOptionsOptions) {
  const { now } = useNow()
  const startOptions = computed(() => startTimeOptions(toValue(date), now.value))
  const endOptions = computed(() => endTimeOptions(start.value))

  watch(start, () => {
    const isEndOffered = endOptions.value.some((option) => option.value === end.value)
    if (!isEndOffered) end.value = ''
  })

  return { startOptions, endOptions }
}
