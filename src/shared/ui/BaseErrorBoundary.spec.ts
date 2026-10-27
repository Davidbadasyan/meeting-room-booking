import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import BaseErrorBoundary from '@/shared/ui/BaseErrorBoundary.vue'

const Broken = defineComponent({
  setup() {
    throw new Error('Render failed')
  },
})

afterEach(() => vi.restoreAllMocks())

describe('BaseErrorBoundary', () => {
  it('shows its children while they work', () => {
    const wrapper = mount(BaseErrorBoundary, {
      props: { title: 'Broken' },
      slots: { default: () => h('p', 'All good') },
    })
    expect(wrapper.text()).toBe('All good')
  })

  it('shows a fallback with a reload button when a child throws, and stops the error there', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const appErrorHandler = vi.fn<() => void>()
    const wrapper = mount(BaseErrorBoundary, {
      props: { title: 'The schedule could not be shown.' },
      slots: { default: () => h(Broken) },
      global: { config: { errorHandler: appErrorHandler } },
    })
    await nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('The schedule could not be shown.')
    expect(wrapper.get('button').text()).toBe('Reload page')
    expect(appErrorHandler).not.toHaveBeenCalled()
  })
})
