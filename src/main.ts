import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// The mock API is the only backend, so it runs in production builds too.
async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

enableMocking().then(() => createApp(App).mount('#app'))
