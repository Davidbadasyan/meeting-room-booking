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
      // Every slice is used, but a one-page app gives each feature/widget a single reference,
      // which this rule also reports ("consider merging"). The architecture keeps them apart.
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
