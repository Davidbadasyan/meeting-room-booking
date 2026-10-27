import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Run tests in UTC+4 (no DST) so a toISOString-style UTC bug shows up before 04:00 local,
// no matter which time zone the machine or CI runs in. Workers inherit this.
process.env.TZ = 'Asia/Dubai'

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
