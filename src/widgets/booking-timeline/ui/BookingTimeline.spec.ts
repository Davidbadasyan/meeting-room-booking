import type { VueWrapper } from '@vue/test-utils'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Booking } from '@/entities/booking'
import { mountWithProviders, startTestBackend } from '@/mocks/testing'
import BookingTimeline from '@/widgets/booking-timeline/ui/BookingTimeline.vue'

// Local time: 2026-10-27 12:10
const NOW = new Date(2026, 9, 27, 12, 10)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'
const YESTERDAY = '2026-10-26'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let mounted: VueWrapper | undefined
afterEach(() => mounted?.unmount())

function mountTimeline(date: string, canCreate = true) {
  const { wrapper } = mountWithProviders(BookingTimeline, {
    clock: () => NOW,
    props: { date, canCreate },
  })
  mounted = wrapper
  return wrapper
}

function buttonNamed(wrapper: VueWrapper, name: string) {
  return wrapper.findAll('button').find((button) => button.attributes('aria-label') === name)
}

describe('BookingTimeline', () => {
  it('shows a loading skeleton, then the bookings', async () => {
    startTestBackend(
      server,
      [{ id: 'a', date: TOMORROW, start: '10:00', end: '11:00', title: 'Planning' }],
      NOW,
    )
    const wrapper = mountTimeline(TOMORROW)

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Planning'))
    expect(wrapper.text()).toContain('10:00–11:00')
  })

  it('shows "Untitled" for a booking without a title', async () => {
    startTestBackend(server, [{ id: 'a', date: TOMORROW, start: '10:00', end: '11:00' }], NOW)
    const wrapper = mountTimeline(TOMORROW)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Untitled'))
  })

  it('opens the create form from a free slot with that start time', async () => {
    startTestBackend(server, [], NOW)
    const wrapper = mountTimeline(TOMORROW)
    await vi.waitFor(() => expect(buttonNamed(wrapper, 'Book from 09:30')).toBeDefined())

    await buttonNamed(wrapper, 'Book from 09:30')?.trigger('click')
    expect(wrapper.emitted('create')).toEqual([['09:30']])
  })

  it('shows the empty state with a "Book a slot" button and keeps the free slots', async () => {
    startTestBackend(server, [], NOW)
    const wrapper = mountTimeline(TOMORROW)
    await vi.waitFor(() => expect(wrapper.text()).toContain('No bookings for this day'))

    const bookSlot = wrapper.findAll('button').find((button) => button.text() === 'Book a slot')
    await bookSlot?.trigger('click')
    expect(wrapper.emitted('create')).toEqual([[]])
    expect(buttonNamed(wrapper, 'Book from 09:00')).toBeDefined()
  })

  it('has no create button on a past date', async () => {
    startTestBackend(server, [], NOW)
    const wrapper = mountTimeline(YESTERDAY, false)
    await vi.waitFor(() => expect(wrapper.text()).toContain('No bookings for this day'))
    expect(wrapper.text()).not.toContain('Book a slot')
  })

  it('labels past time and started bookings in text, and disables their buttons', async () => {
    const started: Booking = { id: 'a', date: TODAY, start: '12:00', end: '13:00', title: 'Sync' }
    const ended: Booking = { id: 'b', date: TODAY, start: '09:00', end: '10:00', title: 'Standup' }
    startTestBackend(server, [started, ended], NOW)
    const wrapper = mountTimeline(TODAY)
    await vi.waitFor(() => expect(wrapper.text()).toContain('In progress'))

    expect(wrapper.text()).toContain('Ended')
    expect(wrapper.text()).toContain('Past')
    expect(buttonNamed(wrapper, 'Edit 12:00–13:00, Sync')?.attributes('disabled')).toBeDefined()
    expect(
      buttonNamed(wrapper, 'Delete 09:00–10:00, Standup')?.attributes('disabled'),
    ).toBeDefined()
  })

  it('emits edit and remove for an upcoming booking', async () => {
    const booking: Booking = {
      id: 'a',
      date: TOMORROW,
      start: '10:00',
      end: '11:00',
      title: 'Planning',
    }
    startTestBackend(server, [booking], NOW)
    const wrapper = mountTimeline(TOMORROW)
    await vi.waitFor(() => expect(buttonNamed(wrapper, 'Edit 10:00–11:00, Planning')).toBeDefined())

    await buttonNamed(wrapper, 'Edit 10:00–11:00, Planning')?.trigger('click')
    await buttonNamed(wrapper, 'Delete 10:00–11:00, Planning')?.trigger('click')
    expect(wrapper.emitted('edit')).toEqual([[booking]])
    expect(wrapper.emitted('remove')).toEqual([[booking]])
  })

  it('shows an error with Retry, and recovers', async () => {
    const backend = startTestBackend(server, [], NOW)
    backend.simulateListFailure()
    const wrapper = mountTimeline(TOMORROW)
    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain('Could not load bookings'),
    )

    // The server recovers: a fresh backend without the simulated failure.
    startTestBackend(server, [], NOW)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Retry')
      ?.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('No bookings for this day'))
  })

  it('does not show the previous date while the next one loads', async () => {
    startTestBackend(
      server,
      [{ id: 'a', date: TOMORROW, start: '10:00', end: '11:00', title: 'Planning' }],
      NOW,
    )
    const wrapper = mountTimeline(TOMORROW)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Planning'))

    await wrapper.setProps({ date: '2026-10-29' })
    expect(wrapper.text()).not.toContain('Planning')
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })
})
