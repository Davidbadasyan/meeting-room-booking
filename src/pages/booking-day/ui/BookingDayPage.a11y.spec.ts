import type { VueWrapper } from '@vue/test-utils'
import axe from 'axe-core'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Booking } from '@/entities/booking'
import { mountWithProviders, startTestBackend } from '@/mocks/testing'
import BookingDayPage from '@/pages/booking-day/ui/BookingDayPage.vue'

// Local time: 2026-10-27 12:10
const NOW = new Date(2026, 9, 27, 12, 10)
const TODAY = '2026-10-27'

const BOOKINGS: Booking[] = [
  { id: 'a', date: TODAY, start: '09:30', end: '10:00', title: 'Standup' },
  { id: 'b', date: TODAY, start: '12:00', end: '13:00', title: 'Sync' },
  { id: 'c', date: TODAY, start: '14:00', end: '15:30' },
]

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let mounted: VueWrapper | undefined
afterEach(() => {
  mounted?.unmount()
  document.body.innerHTML = ''
})

/** Rule ids with the elements that break them, so a failure says what to fix. */
async function accessibilityViolations(): Promise<string[]> {
  // jsdom cannot compute colours; contrast is measured in the browser instead.
  const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`,
  )
}

/** Mounts the page on TODAY; start the test backend first. */
function mountPage() {
  window.history.replaceState(null, '', `/?date=${TODAY}`)
  const { wrapper } = mountWithProviders(BookingDayPage, { clock: () => NOW })
  mounted = wrapper
}

function clickButton(selector: string) {
  const button = document.querySelector<HTMLButtonElement>(selector)
  if (button === null) throw new Error(`No button ${selector}`)
  button.click()
}

describe('BookingDayPage accessibility (axe)', () => {
  it('has no violations in the day view with past time, started and upcoming bookings', async () => {
    startTestBackend(server, BOOKINGS, NOW)
    mountPage()
    await vi.waitFor(() => expect(document.body.textContent).toContain('In progress'))

    expect(await accessibilityViolations()).toEqual([])
  })

  it('has no violations with the booking form open', async () => {
    startTestBackend(server, BOOKINGS, NOW)
    mountPage()
    await vi.waitFor(() => clickButton('button[aria-label="Book from 16:00"]'))
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())

    expect(await accessibilityViolations()).toEqual([])
  })

  it('has no violations with the delete confirmation open', async () => {
    startTestBackend(server, BOOKINGS, NOW)
    mountPage()
    await vi.waitFor(() => clickButton('button[aria-label="Delete 14:00–15:30, Untitled"]'))
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).not.toBeNull())

    expect(await accessibilityViolations()).toEqual([])
  })

  it('has no violations in the error state', async () => {
    const backend = startTestBackend(server, [], NOW)
    backend.simulateListFailure()
    mountPage()
    await vi.waitFor(() => expect(document.body.textContent).toContain('Could not load bookings'))

    expect(await accessibilityViolations()).toEqual([])
  })
})
