import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Dev/demo mock backend lives outside the FSD layers.
    ignores: ['./src/mocks/**'],
  },
  {
    rules: {
      // TODO(step 6): back to 'error' once pages use the features (warn while there is no UI).
      'fsd/insignificant-slice': 'warn',
      // The project uses the @/ alias everywhere, including inside a slice.
      'fsd/import-locality': 'off',
    },
  },
  {
    // The architecture spec names this segment `providers` (Vue plugins installed in main.ts).
    files: ['./src/app/providers/**'],
    rules: { 'fsd/segments-by-purpose': 'off' },
  },
])
