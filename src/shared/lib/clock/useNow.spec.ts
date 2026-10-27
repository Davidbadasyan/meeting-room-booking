import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref, type Ref } from 'vue'
import { CLOCK_KEY, type Clock } from '@/shared/lib/clock/clock'
import { useNow } from '@/shared/lib/clock/useNow'

const START = new Date(2026, 9, 27, 12, 0)
const TICK_MS = 1000

function mountUseNow(clock: Clock, tickMs: Ref<number> = ref(TICK_MS)) {
  const results: Array<ReturnType<typeof useNow>> = []
  const Host = defineComponent({
    setup() {
      results.push(useNow(tickMs))
      return () => null
    },
  })
  const wrapper = mount(Host, { global: { provide: { [CLOCK_KEY]: clock } } })
  const [result] = results
  if (result === undefined) throw new Error('useNow did not run')
  return { now: result.now, wrapper }
}

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
  })
  afterEach(() => vi.useRealTimers())

  it('reads the provided clock', () => {
    const fixed = new Date(2030, 0, 1, 9, 0)
    const { now } = mountUseNow(() => fixed)
    expect(now.value).toBe(fixed)
  })

  it('refreshes on every tick', () => {
    const { now } = mountUseNow(() => new Date())
    expect(now.value).toEqual(START)

    vi.advanceTimersByTime(TICK_MS)
    expect(now.value).toEqual(new Date(START.getTime() + TICK_MS))
  })

  it('restarts the timer when the tick interval changes', async () => {
    const tickMs = ref(TICK_MS)
    const { now } = mountUseNow(() => new Date(), tickMs)
    tickMs.value = 5 * TICK_MS
    await nextTick()

    vi.advanceTimersByTime(TICK_MS)
    expect(now.value).toEqual(START)
    vi.advanceTimersByTime(4 * TICK_MS)
    expect(now.value).toEqual(new Date(START.getTime() + 5 * TICK_MS))
  })

  it('stops the timer when the component unmounts', () => {
    const { wrapper } = mountUseNow(() => new Date())
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
