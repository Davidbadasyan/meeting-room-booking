import '@/app/styles/main.css'

import { createApp } from 'vue'
import App from '@/app/App.vue'
import { apiProvider } from '@/app/providers/api'
import { errorHandlerProvider } from '@/app/providers/errorHandler'
import { vueQueryProvider } from '@/app/providers/vueQuery'
import { API_MODE } from '@/shared/config'
import { toast } from '@/shared/ui'

const MOCK_UNAVAILABLE_MESSAGE =
  'The demo API could not start in this browser (service workers are blocked, for example in a private window). Please open the demo in a regular window.'

// In mock mode the MSW worker is the backend, so it runs in production builds too.
async function enableMocking() {
  if (API_MODE !== 'mock') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
  const { mountDemoToolbar } = await import('@/mocks/demoToolbar')
  mountDemoToolbar()
}

/** Never leave the page blank: if the mock API fails, the app still mounts and explains why. */
async function isMockingReady(): Promise<boolean> {
  try {
    await enableMocking()
    return true
  } catch (error) {
    console.error('[mock API] could not start', error)
    return false
  }
}

async function startApp() {
  const isReady = await isMockingReady()
  createApp(App).use(errorHandlerProvider).use(vueQueryProvider).use(apiProvider).mount('#app')
  if (!isReady) toast.error(MOCK_UNAVAILABLE_MESSAGE, { duration: Infinity })
}

startApp()
