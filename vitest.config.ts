import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Never run tests in UTC: a toISOString-style bug only shows when local and UTC dates differ.
// Default is UTC+4 (no DST); `npm run test:tz` also runs the date tests in UTC-7/-8.
// Workers inherit this.
process.env.TZ = process.env.TEST_TZ ?? 'Asia/Dubai'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
