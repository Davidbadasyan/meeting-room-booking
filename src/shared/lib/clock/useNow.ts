import { inject, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { CLOCK_KEY, systemClock } from '@/shared/lib/clock/clock'
import { CLOCK_TICK_MS } from '@/shared/config'

/**
 * The current time as a ref that refreshes every `tickMs`, so "is this slot in the past?"
 * stays correct while the page is open. Reads the clock provided under CLOCK_KEY.
 */
export function useNow(tickMs: MaybeRefOrGetter<number> = CLOCK_TICK_MS) {
  const readClock = inject(CLOCK_KEY, systemClock)
  const now = shallowRef(readClock())
  let timerId: ReturnType<typeof setInterval> | undefined

  function tick() {
    now.value = readClock()
  }

  function stopTicking() {
    clearInterval(timerId)
  }

  function startTicking(intervalMs: number) {
    stopTicking()
    timerId = setInterval(tick, intervalMs)
  }

  watch(() => toValue(tickMs), startTicking, { immediate: true })
  onScopeDispose(stopTicking)

  return { now }
}
