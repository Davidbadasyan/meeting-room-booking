# Implementation Steps: Meeting Room Booking (Vue 3)

Timebox: 4–6 hours. Commit after each step.

## Stack
- **Vue 3 + Vite + TypeScript**: Composition API with `<script setup lang="ts">`, strict TS, type-checked with `vue-tsc`
- **MSW** (Mock Service Worker) for the mock API. It works reliably on Vercel/Netlify, unlike an in-memory store in serverless functions, which can reset or split across instances.
- **TanStack Vue Query** (`@tanstack/vue-query`) for server state: loading, error, refetch, cache invalidation
- **Pinia** only for UI state if needed (selected date, open modal); server data lives in Vue Query
- **VeeValidate + zod** (`@vee-validate/zod`) for the form, reusing the domain rules
- **Reka UI** (headless, accessible primitives) for Dialog, AlertDialog and Toast, which gives you focus trap, Esc and ARIA for free
- **date-fns** for date handling
- **Vitest + @vue/test-utils** for tests
- Styling: Tailwind CSS or plain scoped CSS (your choice)

---

## Step 0: Ask questions first (10 min)
The task explicitly rewards asking. Send these, then keep working and record your assumptions in the README:

> Not sent yet: answered with assumptions, listed in the README as pending confirmation.
- [ ] Time step for start/end: 15 or 30 minutes?
- [ ] Which timezone defines "today": the user's local time?
- [ ] Can a booking that has already started or ended be edited or deleted?
- [ ] Is `title` optional in the UI as well as in the type?

## Step 1: Project setup (20 min)
- [x] `npm create vue@latest` and select TypeScript, Vitest, ESLint, Prettier (skip Router unless you want it)
- [x] Install: `@tanstack/vue-query`, `msw`, `vee-validate`, `@vee-validate/zod`, `zod`, `reka-ui`, `date-fns`
- [x] Folder structure:
  ```
  src/
    domain/                 // types, time utils, validation rules (pure TS, no Vue)
    api/                    // BookingsApi interface + fetch implementation + typed errors
    mocks/                  // MSW handlers + in-memory store
    features/bookings/
      composables/          // useBookings, useCreateBooking, ...
      components/           // BookingDayView, BookingForm, BookingItem, ...
    components/ui/          // generic UI (Button, Spinner, EmptyState, ErrorState)
    App.vue
    main.ts
  ```

## Step 2: Domain layer, the most important part (45 min)
Pure TypeScript, no Vue imports, so it's shared by UI and mock server.
- [x] `Booking` and `BookingDraft` types
- [x] Constants: `WORK_START = '09:00'`, `WORK_END = '18:00'`, `MIN_DURATION = 30`, `MAX_DURATION = 120`, `SLOT_STEP`
- [x] Helpers: `timeToMinutes`, `minutesToTime`, `isPastDate`, `isPastTime`, `generateTimeOptions`
- [x] `validateBooking(draft, existing, now, editingId?)` returns a list of typed errors
- [x] Rules:
  - [x] Start and end within 09:00–18:00
  - [x] `start < end`
  - [x] Minimum duration 30 minutes
  - [x] Maximum duration 2 hours
  - [x] No overlap (touching is allowed: `a.start < b.end && b.start < a.end`)
  - [x] No past dates; for today, no past time
  - [x] When editing, exclude the booking itself from the overlap check
- [x] Vitest tests for every rule, including edge cases:
  - [x] 10:00–11:00 next to 11:00–12:00 is valid
  - [x] Exactly 30 min and exactly 2 h are valid
  - [x] 09:00 start and 18:00 end are valid
  - [x] Editing a booking without changing its time is valid
- [x] Pass `now` as a parameter (never call `new Date()` inside rules) so tests are deterministic

## Step 3: Mock API with MSW (40 min)
- [x] In-memory store seeded with a few bookings (optionally persisted to localStorage)
- [x] Handlers:
  - [x] `GET /api/bookings?date=YYYY-MM-DD`
  - [x] `POST /api/bookings`
  - [x] `PATCH /api/bookings/:id`
  - [x] `DELETE /api/bookings/:id`
- [x] Server reuses `validateBooking` from `domain/`:
  - [x] `400` for invalid data (with error details)
  - [x] `409` for overlaps
  - [x] `404` for a missing id
- [x] Artificial delay (300–800 ms) so loading states are visible
- [x] Conflict simulation for rule 8: a dev toggle or `?simulateConflict=1` that makes the server insert a "someone else booked this" entry and return `409`
- [x] Start the worker in `main.ts` before `app.mount()` (await `worker.start()`)

## Step 4: API layer (20 min)
- [x] `BookingsApi` interface (`list`, `create`, `update`, `remove`)
- [x] `fetch` implementation in `api/httpBookingsApi.ts`
- [x] Typed errors: `ConflictError`, `ValidationError`, `NotFoundError`, `NetworkError`
- [x] Provide the API via `provide/inject` (or a single module export) so the UI depends only on the interface and a real backend is a one-file swap

## Step 5: Composables with Vue Query (25 min)
- [x] Register `VueQueryPlugin` in `main.ts`
- [x] `useBookings(date: Ref<string>)` with a reactive query key `['bookings', date]`
- [x] `useCreateBooking`, `useUpdateBooking`, `useDeleteBooking`
- [x] On success: invalidate `['bookings', date]`
- [x] On `409`: invalidate the query (refresh the list) and keep the form open with the user's data

## Step 6: UI components (90 min)
- [x] `DatePicker`: native `<input type="date">` is fine; past dates are viewable, create is disabled
- [x] `BookingDayView`: timeline or slot list for 09:00–18:00 showing bookings; past slots greyed out for today
- [x] `BookingForm` (inside a Reka UI `Dialog`): start, end, title, VeeValidate + zod schema built from the domain rules, inline errors
- [x] Edit: open the same form prefilled; pass `editingId` to validation
- [x] Delete: Reka UI `AlertDialog` confirmation
- [x] UI states:
  - [x] Loading (skeleton or spinner)
  - [x] Empty ("No bookings for this day")
  - [x] Error with a Retry button (`refetch`)
  - [x] Submitting (button disabled, spinner; use `isPending` from the mutation)
- [x] Conflict banner inside the form: "This slot was just taken. The list has been updated, please choose another time." Form values stay intact.
- [x] Success toast after create, update and delete

## Step 7: Responsiveness and accessibility (30 min)
- [x] Mobile layout (stacked day view, full-width dialog)
- [x] Labels on all inputs; errors linked via `aria-describedby`
- [x] `aria-live="polite"` region for errors and conflict messages
- [x] Dialog focus trap, Esc to close, focus returns on close (Reka UI handles this)
- [x] Visible focus styles and full keyboard navigation
- [x] Sufficient color contrast; don't rely on color alone (e.g. "Past" or "Booked" labels)

## Step 8: Quality checks, deploy, README (30 min)
- [x] `npm run type-check` (vue-tsc), `npm run lint`, `npm run test` all pass
- [x] Optional: one component test for the conflict flow (form keeps data after a `409`)
- [ ] Deploy to Vercel or Netlify (settings documented in the README; not deployed yet)
- [x] Ensure `public/mockServiceWorker.js` exists (`npx msw init public/`) and MSW is enabled in production
- [x] README:
  - [x] How to run (`npm install`, `npm run dev`, `npm test`)
  - [x] What's done
  - [x] What's not done and what you'd do next
  - [x] Assumptions (answers or guesses from Step 0)
  - [x] Architecture overview (domain / api / mocks / composables / components)
  - [x] How to trigger the conflict demo
  - [x] Time spent
- [ ] Export the AI chat transcripts (this chat and your Claude Code sessions)

---

## First prompt for Claude Code
> Read TASK.md and STEPS.md. Set up a Vue 3 + Vite + TypeScript project (Composition API, `<script setup>`, strict mode) with the folder structure from Step 1 and install the listed packages. Then do Step 2: implement the domain types and a pure `validateBooking` function covering all business rules, with Vitest tests for each rule and its edge cases. Don't build UI yet.
