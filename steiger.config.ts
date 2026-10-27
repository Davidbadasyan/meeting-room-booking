import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Dev/demo mock backend lives outside the FSD layers.
    ignores: ['./src/mocks/**'],
  },
  {
    // TODO: back to 'error' once pages/features consume the slices (STEPS.md step 6).
    rules: {
      'fsd/insignificant-slice': 'warn',
      // The project uses the @/ alias everywhere, including inside a slice.
      'fsd/import-locality': 'off',
    },
  },
])
