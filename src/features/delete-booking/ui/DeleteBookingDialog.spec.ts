import type { VueWrapper } from '@vue/test-utils'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Booking } from '@/entities/booking'
import DeleteBookingDialog from '@/features/delete-booking/ui/DeleteBookingDialog.vue'
import { mountWithProviders, startTestBackend } from '@/mocks/testing'
import { toast } from '@/shared/ui'

// Local time: 2026-10-27 12:10
const NOW = new Date(2026, 9, 27, 12, 10)

const PLANNING: Booking = {
  id: 'a',
  date: '2026-10-28',
  start: '10:00',
  end: '11:00',
  title: 'Planning',
}
const STARTED: Booking = {
  id: 'b',
  date: '2026-10-27',
  start: '12:00',
  end: '13:00',
  title: 'Sync',
}

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let mounted: VueWrapper | undefined
afterEach(() => {
  mounted?.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function mountDialog(booking: Booking) {
  const { wrapper } = mountWithProviders(DeleteBookingDialog, {
    clock: () => NOW,
    props: { open: true, booking },
  })
  mounted = wrapper
  return wrapper
}

function clickButton(text: string) {
  const buttons = [...document.querySelectorAll('button')]
  buttons.find((button) => button.textContent?.trim() === text)?.click()
}

describe('DeleteBookingDialog', () => {
  it('shows the booking time and deletes it with a success toast', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const success = vi.spyOn(toast, 'success')
    const wrapper = mountDialog(PLANNING)
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).not.toBeNull())
    expect(document.body.textContent).toContain('Wednesday, 28 October 2026, 10:00–11:00: Planning')

    clickButton('Delete')

    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
    expect(backend.store.get(PLANNING.id)).toBeUndefined()
    expect(success).toHaveBeenCalledWith('Booking deleted.')
  })

  it('says the booking was already deleted on a 404', async () => {
    startTestBackend(server, [], NOW)
    const info = vi.spyOn(toast, 'info')
    const wrapper = mountDialog(PLANNING)
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).not.toBeNull())

    clickButton('Delete')

    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
    expect(info).toHaveBeenCalledWith(
      'This booking had already been deleted. The list has been updated.',
    )
  })

  it('stays open and explains why when the server refuses', async () => {
    startTestBackend(server, [STARTED], NOW)
    const wrapper = mountDialog(STARTED)
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).not.toBeNull())

    clickButton('Delete')

    await vi.waitFor(() =>
      expect(document.querySelector('[role="alertdialog"] [role="alert"]')?.textContent).toBe(
        'The booking has started.',
      ),
    )
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})
