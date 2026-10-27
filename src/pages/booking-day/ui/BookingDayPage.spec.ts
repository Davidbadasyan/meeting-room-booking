import type { VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountWithProviders, startTestBackend } from '@/mocks/testing'
import BookingDayPage from '@/pages/booking-day/ui/BookingDayPage.vue'

// Local time: 2026-10-27 12:10; the page shows tomorrow via ?date.
const NOW = new Date(2026, 9, 27, 12, 10)
const TOMORROW = '2026-10-28'
const CONFLICT_MESSAGE =
  'This slot was just taken. The list has been updated — please choose another time.'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let mounted: VueWrapper | undefined
afterEach(() => {
  mounted?.unmount()
  document.body.innerHTML = ''
})

function buttonLabelled(label: string): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  if (button === null) throw new Error(`No button labelled ${label}`)
  return button
}

function buttonWithText(text: string): HTMLButtonElement {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')]
  const match = buttons.find((button) => button.textContent?.trim() === text)
  if (match === undefined) throw new Error(`No button with text ${text}`)
  return match
}

/** The dialog's fields, found through their <label>s. */
function controlIdFor(label: string): string {
  const labels = [...document.querySelectorAll<HTMLLabelElement>('[role="dialog"] label')]
  const match = labels.find((candidate) => candidate.textContent === label)
  if (match === undefined) throw new Error(`No field labelled ${label}`)
  return match.htmlFor
}

function selectField(label: string): HTMLSelectElement {
  const select = document.querySelector<HTMLSelectElement>(`select[id="${controlIdFor(label)}"]`)
  if (select === null) throw new Error(`No select labelled ${label}`)
  return select
}

function inputField(label: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`input[id="${controlIdFor(label)}"]`)
  if (input === null) throw new Error(`No input labelled ${label}`)
  return input
}

async function typeInto(field: HTMLInputElement | HTMLSelectElement, value: string) {
  field.value = value
  field.dispatchEvent(new Event('change'))
  field.dispatchEvent(new Event('input'))
  await nextTick()
}

describe('BookingDayPage: server conflict (rule 8)', () => {
  it('shows the banner, keeps the values and lists the booking that won the slot', async () => {
    window.history.replaceState(null, '', `/?date=${TOMORROW}`)
    const backend = startTestBackend(server, [], NOW)
    backend.simulateConflict()
    const { wrapper } = mountWithProviders(BookingDayPage, { clock: () => NOW })
    mounted = wrapper

    // Open the form from a free slot.
    await vi.waitFor(() => buttonLabelled('Book from 16:00'))
    buttonLabelled('Book from 16:00').click()
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    expect(selectField('Start').value).toBe('16:00')

    // Fill in and submit.
    await typeInto(selectField('End'), '17:00')
    await typeInto(inputField('Title'), 'Retro')
    buttonWithText('Create booking').click()

    // The banner appears inside the dialog.
    await vi.waitFor(() =>
      expect(document.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain(
        CONFLICT_MESSAGE,
      ),
    )
    // The user's values are intact.
    expect(selectField('Start').value).toBe('16:00')
    expect(selectField('End').value).toBe('17:00')
    expect(inputField('Title').value).toBe('Retro')
    // The refreshed list behind the dialog shows the booking that took the slot.
    expect(wrapper.text()).toContain('16:00–17:00')
    expect(wrapper.text()).toContain('Booked by someone else')
    // The dialog stays open.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })
})

describe('BookingDayPage: document title', () => {
  it('names the selected day in the tab title', async () => {
    window.history.replaceState(null, '', `/?date=${TOMORROW}`)
    startTestBackend(server, [], NOW)
    const { wrapper } = mountWithProviders(BookingDayPage, { clock: () => NOW })
    mounted = wrapper

    expect(document.title).toBe('Wednesday, 28 October 2026 · Meeting Room Booking')
  })
})

describe('BookingDayPage: delete dialog', () => {
  it('does not carry an error from one booking over to the next', async () => {
    window.history.replaceState(null, '', `/?date=${TOMORROW}`)
    startTestBackend(
      server,
      [
        { id: 'a', date: TOMORROW, start: '10:00', end: '11:00', title: 'Planning' },
        { id: 'b', date: TOMORROW, start: '14:00', end: '15:00', title: 'Review' },
      ],
      NOW,
    )
    server.use(http.delete('*/api/bookings/:id', () => HttpResponse.error()))
    const { wrapper } = mountWithProviders(BookingDayPage, { clock: () => NOW })
    mounted = wrapper

    // Deleting the first booking fails with a network error.
    await vi.waitFor(() => buttonLabelled('Delete 10:00–11:00, Planning'))
    buttonLabelled('Delete 10:00–11:00, Planning').click()
    await vi.waitFor(() => buttonWithText('Delete').closest('[role="alertdialog"]'))
    const confirm = [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')]
    confirm.find((button) => button.textContent?.trim() === 'Delete')?.click()
    await vi.waitFor(() =>
      expect(document.querySelector('[role="alertdialog"] [role="alert"]')).not.toBeNull(),
    )

    // Cancel, then open delete for the second booking: no old error.
    buttonWithText('Cancel').click()
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull())
    buttonLabelled('Delete 14:00–15:00, Review').click()
    await vi.waitFor(() => expect(document.body.textContent).toContain('14:00–15:00: Review'))
    expect(document.querySelector('[role="alertdialog"] [role="alert"]')).toBeNull()
  })
})
