import { computed, ref, watch } from 'vue'
import { readDateParam, withDateParam } from '@/features/select-date/lib/dateQuery'
import { useNow } from '@/shared/lib/clock'
import { addDaysToIsoDate, isPastDate, toIsoDate, type IsoDate } from '@/shared/lib/time'

/** `replaceState`: the URL is shareable and survives a reload without filling the history. */
function writeDateToUrl(date: IsoDate | undefined) {
  const { pathname, search, hash } = window.location
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${withDateParam(search, date)}${hash}`,
  )
}

/**
 * The day being viewed, kept in `?date=`. A date the user picked never changes by itself;
 * without one the view follows today, so only that default moves at midnight.
 */
export function useSelectedDate() {
  const { now } = useNow()
  const today = computed(() => toIsoDate(now.value))
  const pickedDate = ref(readDateParam(window.location.search))
  const selectedDate = computed(() => pickedDate.value ?? today.value)
  const isPast = computed(() => isPastDate(selectedDate.value, now.value))

  // `immediate` also removes an invalid ?date from the URL on load.
  watch(pickedDate, writeDateToUrl, { immediate: true })

  function selectDate(date: IsoDate) {
    pickedDate.value = date
  }

  function goToToday() {
    pickedDate.value = undefined
  }

  function goToPreviousDay() {
    selectDate(addDaysToIsoDate(selectedDate.value, -1))
  }

  function goToNextDay() {
    selectDate(addDaysToIsoDate(selectedDate.value, 1))
  }

  return { selectedDate, today, isPast, selectDate, goToToday, goToPreviousDay, goToNextDay }
}
