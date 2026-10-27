import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BookingDatePicker from '@/features/select-date/ui/BookingDatePicker.vue'

describe('BookingDatePicker', () => {
  it('labels the date input and emits the picked date', async () => {
    const wrapper = mount(BookingDatePicker, { props: { date: '2026-10-27', isPast: false } })
    const input = wrapper.get('input[type="date"]')
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Date')

    await input.setValue('2026-10-30')
    expect(wrapper.emitted('select')).toEqual([['2026-10-30']])
  })

  it('ignores a cleared input', async () => {
    const wrapper = mount(BookingDatePicker, { props: { date: '2026-10-27', isPast: false } })
    await wrapper.get('input[type="date"]').setValue('')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('emits the day navigation buttons', async () => {
    const wrapper = mount(BookingDatePicker, { props: { date: '2026-10-27', isPast: false } })
    for (const label of ['Previous day', 'Today', 'Next day']) {
      const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)
      await button?.trigger('click')
    }
    expect(Object.keys(wrapper.emitted())).toEqual(
      expect.arrayContaining(['previous', 'today', 'next']),
    )
  })

  it('shows the view-only notice for past dates', () => {
    const wrapper = mount(BookingDatePicker, { props: { date: '2026-10-20', isPast: true } })
    expect(wrapper.get('[role="status"]').text()).toBe('Past dates are view-only.')
  })
})
