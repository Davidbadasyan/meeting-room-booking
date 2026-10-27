import { createApp } from 'vue'
import DemoToolbar from '@/mocks/DemoToolbar.vue'

/** A separate tiny Vue app below the page, so the real app never depends on the mocks. */
export function mountDemoToolbar() {
  const container = document.createElement('div')
  document.body.append(container)
  createApp(DemoToolbar).mount(container)
}
