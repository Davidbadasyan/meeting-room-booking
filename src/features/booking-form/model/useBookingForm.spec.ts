import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { bookingsByDateKey, type Booking } from '@/entities/booking'
import { useBookingForm } from '@/features/booking-form/model/useBookingForm'
import { mountComposable, startTestBackend } from '@/mocks/testing'

// Local time: 2026-10-27 12:00
const NOW = new Date(2026, 9, 27, 12, 0)
const EARLY_MORNING = new Date(2026, 9, 27, 8, 0)
const TODAY = '2026-10-27'
const TOMORROW = '2026-10-28'

const PLANNING: Booking = {
  id: 'a',
  date: TOMORROW,
  start: '10:00',
  end: '11:00',
  title: 'Planning',
}

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let unmount = () => {}
afterEach(() => unmount())

function mountForm(options: { date: string; booking?: Booking; clientNow?: Date }) {
  const mounted = mountComposable(
    () => useBookingForm({ date: options.date, booking: options.booking }),
    () => options.clientNow ?? NOW,
  )
  unmount = mounted.unmount
  return mounted
}

function cachedBookings(queryClient: ReturnType<typeof mountForm>['queryClient'], date: string) {
  const bookings: Booking[] | undefined = queryClient.getQueryData(bookingsByDateKey(date))
  return bookings ?? []
}

describe('useBookingForm: create', () => {
  it('saves a valid booking and refreshes the list', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: form, queryClient } = mountForm({ date: TOMORROW })
    form.start.value = '12:00'
    form.end.value = '13:00'
    form.title.value = 'Lunch talk'

    const saved = await form.submit()

    expect(saved).toMatchObject({
      date: TOMORROW,
      start: '12:00',
      end: '13:00',
      title: 'Lunch talk',
    })
    expect(backend.store.byDate(TOMORROW)).toHaveLength(2)
    expect(cachedBookings(queryClient, TOMORROW)).toHaveLength(2)
    expect(form.submitProblem.value).toBeUndefined()
  })

  it('does not send a draft that breaks a rule', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: form } = mountForm({ date: TOMORROW })
    form.start.value = '12:00'
    form.end.value = '12:15'

    expect(await form.submit()).toBeUndefined()
    expect(form.errors.value.end).toBe('Minimum duration is 30 minutes')
    expect(backend.store.byDate(TOMORROW)).toHaveLength(1)
  })
})

describe('useBookingForm: 409 conflict', () => {
  it('refreshes the list, keeps the input and marks the overlap on the field', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: form, queryClient } = mountForm({ date: TOMORROW })
    await vi.waitFor(() => expect(cachedBookings(queryClient, TOMORROW)).toHaveLength(1))
    backend.simulateConflict()
    form.start.value = '16:00'
    form.end.value = '17:00'
    form.title.value = 'Retro'

    expect(await form.submit()).toBeUndefined()

    expect(form.submitProblem.value).toBe('conflict')
    expect(form.submitMessage.value).toBe(
      'This slot was just taken. The list has been updated, please choose another time.',
    )
    expect([form.start.value, form.end.value, form.title.value]).toEqual([
      '16:00',
      '17:00',
      'Retro',
    ])
    expect(cachedBookings(queryClient, TOMORROW)).toHaveLength(2)
    expect(form.errors.value.start).toBe('This time overlaps another booking')
  })
})

describe('useBookingForm: 400 from the server', () => {
  it('shows server rule errors on the matching field', async () => {
    // The client clock is behind the server, so only the server sees 11:00 as past.
    startTestBackend(server, [], NOW)
    const { result: form } = mountForm({ date: TODAY, clientNow: EARLY_MORNING })
    form.start.value = '11:00'
    form.end.value = '11:30'

    expect(await form.submit()).toBeUndefined()

    expect(form.submitProblem.value).toBe('invalid')
    expect(form.errors.value.start).toBe('You cannot book time in the past')
    expect([form.start.value, form.end.value]).toEqual(['11:00', '11:30'])
  })

  it('shows details without a form field as general messages', async () => {
    startTestBackend(server, [], NOW)
    server.use(
      http.post('*/api/bookings', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid',
              details: [{ code: 'ROOM_CLOSED', field: 'room', message: 'The room is closed' }],
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { result: form } = mountForm({ date: TOMORROW })
    form.start.value = '12:00'
    form.end.value = '13:00'

    await form.submit()

    expect(form.serverMessages.value).toEqual(['The room is closed'])
  })
})

describe('useBookingForm: edit', () => {
  it('is valid without changes (no conflict with itself)', async () => {
    startTestBackend(server, [PLANNING], NOW)
    const { result: form, queryClient } = mountForm({ date: TOMORROW, booking: PLANNING })
    await vi.waitFor(() => expect(cachedBookings(queryClient, TOMORROW)).toHaveLength(1))

    expect(form.isEditing.value).toBe(true)
    expect(await form.submit()).toEqual(PLANNING)
  })

  it('handles a booking deleted elsewhere (404): keeps the input and refreshes the list', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: form, queryClient } = mountForm({ date: TOMORROW, booking: PLANNING })
    await vi.waitFor(() => expect(cachedBookings(queryClient, TOMORROW)).toHaveLength(1))
    backend.store.remove(PLANNING.id)
    form.title.value = 'Planning v2'

    expect(await form.submit()).toBeUndefined()

    expect(form.submitProblem.value).toBe('notFound')
    expect(form.title.value).toBe('Planning v2')
    expect(cachedBookings(queryClient, TOMORROW)).toEqual([])
  })

  it('offers to save the kept values as a new booking after a 404', async () => {
    const backend = startTestBackend(server, [PLANNING], NOW)
    const { result: form } = mountForm({ date: TOMORROW, booking: PLANNING })
    expect(form.canCreateAsNew.value).toBe(false)
    backend.store.remove(PLANNING.id)
    form.title.value = 'Planning v2'
    await form.submit()
    expect(form.canCreateAsNew.value).toBe(true)

    const created = await form.submitAsNew()

    expect(created).toMatchObject({ start: '10:00', end: '11:00', title: 'Planning v2' })
    expect(created?.id).not.toBe(PLANNING.id)
    expect(backend.store.byDate(TOMORROW)).toHaveLength(1)
    expect(form.canCreateAsNew.value).toBe(false)
  })
})

describe('useBookingForm: other failures', () => {
  it('reports a network failure and keeps the input', async () => {
    startTestBackend(server, [], NOW)
    server.use(http.post('*/api/bookings', () => HttpResponse.error()))
    const { result: form } = mountForm({ date: TOMORROW })
    form.start.value = '12:00'
    form.end.value = '13:00'

    await form.submit()

    expect(form.submitProblem.value).toBe('network')
    expect(form.start.value).toBe('12:00')
  })
})
