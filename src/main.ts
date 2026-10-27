import '@/app/styles/main.css'

import { createApp } from 'vue'
import App from '@/app/App.vue'
import { apiProvider } from '@/app/providers/api'
import { vueQueryProvider } from '@/app/providers/vueQuery'
import { API_MODE } from '@/shared/config'

// In mock mode the MSW worker is the backend, so it runs in production builds too.
async function enableMocking() {
  if (API_MODE !== 'mock') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

async function startApp() {
  await enableMocking()
  createApp(App).use(vueQueryProvider).use(apiProvider).mount('#app')
}

startApp()
