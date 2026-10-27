import type { VueWrapper } from '@vue/test-utils'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import BookingFormDialog from '@/features/booking-form/ui/BookingFormDialog.vue'
import { mountWithProviders, startTestBackend } from '@/mocks/testing'

// Local time: 2026-10-27 12:10
const NOW = new Date(2026, 9, 27, 12, 10)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let mounted: VueWrapper | undefined
afterEach(() => {
  mounted?.unmount()
  document.body.innerHTML = ''
})

/** The dialog is teleported to <body>, so the tests query the document. */
function controlIdFor(label: string): string {
  const labels = [...document.querySelectorAll('label')]
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

function optionValues(select: HTMLSelectElement, { enabledOnly = false } = {}) {
  const options = [...select.querySelectorAll('option')].filter((option) => option.value !== '')
  return options.filter((option) => !enabledOnly || !option.disabled).map((option) => option.value)
}

async function choose(label: string, value: string) {
  const control = selectField(label)
  control.value = value
  control.dispatchEvent(new Event('change'))
  control.dispatchEvent(new Event('input'))
  await nextTick()
}

function mountDialog(props: Record<string, unknown>) {
  startTestBackend(server, [], NOW)
  const { wrapper } = mountWithProviders(BookingFormDialog, {
    clock: () => NOW,
    props: { open: true, ...props },
  })
  mounted = wrapper
}

describe('BookingFormDialog', () => {
  it('labels every field and prefills the start from a clicked slot', async () => {
    mountDialog({ date: TOMORROW, initialStart: '09:30' })
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())

    expect(selectField('Start').value).toBe('09:30')
    expect(selectField('End').value).toBe('')
    expect(inputField('Title').getAttribute('maxlength')).toBe('100')
    expect(document.body.textContent).toContain('Wednesday, 28 October 2026')
  })

  it('limits end times to start + 30 min ... start + 2 h, capped at 18:00', async () => {
    mountDialog({ date: TOMORROW })
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())

    expect(optionValues(selectField('End'))).toEqual([])
    await choose('Start', '17:00')
    expect(optionValues(selectField('End'))).toEqual(['17:30', '17:45', '18:00'])
  })

  it('clears an end time that is no longer offered when the start changes', async () => {
    mountDialog({ date: TOMORROW })
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    await choose('Start', '10:00')
    await choose('End', '12:00')

    await choose('Start', '11:00')
    expect(selectField('End').value).toBe('12:00')
    await choose('Start', '09:00')
    expect(selectField('End').value).toBe('')
  })

  it('disables start times that have passed today', async () => {
    mountDialog({ date: TODAY })
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())

    expect(optionValues(selectField('Start'), { enabledOnly: true })[0]).toBe('12:15')
  })

  it('links a field error with aria-describedby and keeps the input', async () => {
    mountDialog({ date: TOMORROW })
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    await choose('Start', '10:00')

    const submitButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Create booking',
    )
    submitButton?.click()

    await vi.waitFor(() => expect(selectField('End').getAttribute('aria-invalid')).toBe('true'))
    const errorId = selectField('End').getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(errorId)?.textContent?.trim()).toBe('Choose an end time')
    expect(selectField('Start').value).toBe('10:00')
  })

  it('moves focus to the first field with an error after a failed submit', async () => {
    mountDialog({ date: TOMORROW })
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    await choose('Start', '10:00')

    const submitButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Create booking',
    )
    submitButton?.click()

    await vi.waitFor(() => expect(document.activeElement).toBe(selectField('End')))
  })
})
