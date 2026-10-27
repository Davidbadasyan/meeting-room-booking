# Project Conventions

These rules apply to every file in `src/`. Read this before writing code.

## 1. Architecture: Feature-Sliced Design (FSD)

Layers, top to bottom: `app → pages → widgets → features → entities → shared`.

- A module may import only from layers **strictly below** it.
- No cross-imports between slices of the same layer.
- Other slices are imported **only through their public API** (`index.ts`), never through deep paths.
- Segments: `ui`, `model`, `api`, `lib`, `config`.
- No catch-all files (`utils.ts`, `types.ts`) that mix different domains.
- Mutations live in `features`; reads (`useBookingsQuery`) live in `entities/booking`.
- `mocks/` sits outside the FSD layers. It is dev/demo only and can be deleted.
- `mocks/` reuses `validateBooking` from `entities/booking`, so client and server share one set of rules.

```
src/
  app/        providers (vueQuery, api), styles, App.vue
  main.ts     start MSW in mock mode, then mount
  pages/      booking-day
  widgets/    booking-timeline
  features/   booking-form, delete-booking, select-date
  entities/   booking (model, api, config, ui)
  shared/     api, lib/time, lib/clock, ui, config
  mocks/      browser, handlers, store
```

## 2. Pure functions vs composables

- Logic **without** reactivity is a plain TS function: validation rules, time helpers, mappers, `mapHttpError`, the API implementation.
- Composables are **only** for stateful logic that uses Vue reactivity, lifecycle, or inject: `useNow`, `useBookingsApi`, `useBookingsQuery`, `useCreate/Update/DeleteBooking`, `useBookingForm`, `useTimelineSlots`.

## 3. Composable conventions (Vue docs)

- Name them `useXxx`, one concern each. Compose small ones.
- Accept inputs as `MaybeRefOrGetter<T>` and read them with `toValue()`.
- Return a plain object of refs (not `reactive()`) so destructuring stays reactive.
- Call them only synchronously at the top of `<script setup>`, never after `await` or inside callbacks.
- Clean up side effects in `onScopeDispose`.
- Pass `now` into pure rules as a parameter. Never call `new Date()` inside rules.

## 4. Vue component conventions (official style guide)

- One component per file, PascalCase filenames, multi-word names.
- `Base` prefix for generic `shared/ui` components.
- Prefix tightly coupled children with the parent's name (`BookingTimelineSlot`).
- `defineProps<{...}>()` / `defineEmits<{...}>()` with TS generics; `defineModel()` for `v-model`.
- Prefer `computed` over `watch`. Use `watch` only for real side effects.
- `provide/inject` with a typed `InjectionKey`, never string keys.
- Components stay presentational: no business logic in templates.
- Never `v-if` and `v-for` on the same element.
- Scoped styles everywhere except `App.vue`.

## 5. Code style: extremely clean and simple

Write code a beginner can read top to bottom. Readability beats cleverness.

**Avoid**
- Unnecessary if/else chains. Use early returns or a lookup map.
- Runtime type checks (`typeof`, `=== 'object'`, `instanceof` guards). Unknown data is validated **once** at the boundary with zod; everything inside trusts its types.
  - Exception: `error instanceof ConflictError` (and the other typed API errors) when handling API errors.
- Nested ternaries, `&&` / `||` tricks, and clever one-liners.
- `any`, `as` casts, non-null `!`, and unnecessary generics.
- More than 2 levels of indentation inside a function.
- Magic numbers and strings. Use named constants from `config/`.
- Premature abstraction. Add no helper until it is used twice.
- Comments that repeat the code. Comment only the "why".

**Prefer**
- Small functions (under ~20 lines) that do one thing.
- Descriptive names; booleans as questions (`isPast`, `canCreate`, `hasConflict`).
- Plain data and functions over classes.
- Early returns for guards, with the main path unindented.
- Lookup maps over switch/if chains (e.g. error code → message).
- Rules as a list of small named checks.
- Times converted to minutes once, then compared as numbers.

**Self-check before finishing each file**
- Could a junior developer explain every line?
- Can any if/else be replaced with an early return or a map?
- Is there a `typeof`, cast, or check that TypeScript already guarantees?
- Is any function longer than it needs to be?

## 6. Imports: always the `@/` alias

- Every import in `src/` uses `@/...`. No `./` or `../`.
- Across slices: the public API only (`@/entities/booking`).
- Inside the same slice: the full alias path (`@/entities/booking/model/rules`).
- Enforced by ESLint `no-restricted-imports` (scoped to `src/`).

## 7. Dates and time

- Calendar dates are `YYYY-MM-DD` strings in the **user's local time**.
- Never use `toISOString()` to get a date. It converts to UTC and can return the wrong day (e.g. before 04:00 in UTC+4).
- Times are `HH:mm` strings at the edges and minutes (numbers) inside the logic.
- The current time comes from `useNow()` / an injected clock, never from scattered `new Date()` calls.

## 8. Enforcement and checks

Run all of these before every commit:

```
npm run type-check   # vue-tsc
npm run lint         # oxlint + ESLint + Steiger (FSD)
npm test             # Vitest
```

## 9. Deliberate deviations (and why)

| Deviation | Reason |
|---|---|
| No `baseUrl` in tsconfig | TypeScript 6 rejects it (TS5101); `paths` works without it |
| Relative-import ban limited to `src/` | Root config files must import `./vite.config.ts` |
| Steiger `segments-by-purpose` off for `app/providers` | Kept the conventional folder name |
| Steiger `import-locality` off | Conflicts with the `@/` alias rule |
| Added `ServerError` | 500s and malformed responses are not network errors |
| Mock bundle is lazy-loaded | Only loaded in mock mode; the real-backend build doesn't include it |
| Tests run in a pinned time zone (`TEST_TZ`, default `Asia/Dubai`); `npm run test:tz` adds `America/Los_Angeles` | A `toISOString`-style UTC bug only shows when the local and UTC dates differ; in UTC it would pass silently |
| `src/mocks/testing.ts` is excluded from `tsconfig.app.json` and type-checked by `tsconfig.vitest.json` | It uses Node-only MSW types and `@vue/test-utils`, which do not belong in the app build |
| Steiger `insignificant-slice` is `warn` until every slice is used by the UI (back to `error` in Step 6) | Features exist before the pages that use them |
