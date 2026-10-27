import '@/app/styles/main.css'

import { createApp } from 'vue'
import App from '@/app/App.vue'
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

enableMocking().then(() => createApp(App).mount('#app'))
