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
- [ ] Time step for start/end: 15 or 30 minutes?
- [ ] Which timezone defines "today": the user's local time?
- [ ] Can a booking that has already started or ended be edited or deleted?
- [ ] Is `title` optional in the UI as well as in the type?

## Step 1: Project setup (20 min)
- [ ] `npm create vue@latest` and select TypeScript, Vitest, ESLint, Prettier (skip Router unless you want it)
- [ ] Install: `@tanstack/vue-query`, `msw`, `vee-validate`, `@vee-validate/zod`, `zod`, `reka-ui`, `date-fns`
- [ ] Folder structure:
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
- [ ] `Booking` and `BookingDraft` types
- [ ] Constants: `WORK_START = '09:00'`, `WORK_END = '18:00'`, `MIN_DURATION = 30`, `MAX_DURATION = 120`, `SLOT_STEP`
- [ ] Helpers: `timeToMinutes`, `minutesToTime`, `isPastDate`, `isPastTime`, `generateTimeOptions`
- [ ] `validateBooking(draft, existing, now, editingId?)` returns a list of typed errors
- [ ] Rules:
  - [ ] Start and end within 09:00–18:00
  - [ ] `start < end`
  - [ ] Minimum duration 30 minutes
  - [ ] Maximum duration 2 hours
  - [ ] No overlap (touching is allowed: `a.start < b.end && b.start < a.end`)
  - [ ] No past dates; for today, no past time
  - [ ] When editing, exclude the booking itself from the overlap check
- [ ] Vitest tests for every rule, including edge cases:
  - [ ] 10:00–11:00 next to 11:00–12:00 is valid
  - [ ] Exactly 30 min and exactly 2 h are valid
  - [ ] 09:00 start and 18:00 end are valid
  - [ ] Editing a booking without changing its time is valid
- [ ] Pass `now` as a parameter (never call `new Date()` inside rules) so tests are deterministic

## Step 3: Mock API with MSW (40 min)
- [ ] In-memory store seeded with a few bookings (optionally persisted to localStorage)
- [ ] Handlers:
  - [ ] `GET /api/bookings?date=YYYY-MM-DD`
  - [ ] `POST /api/bookings`
  - [ ] `PATCH /api/bookings/:id`
  - [ ] `DELETE /api/bookings/:id`
- [ ] Server reuses `validateBooking` from `domain/`:
  - [ ] `400` for invalid data (with error details)
  - [ ] `409` for overlaps
  - [ ] `404` for a missing id
- [ ] Artificial delay (300–800 ms) so loading states are visible
- [ ] Conflict simulation for rule 8: a dev toggle or `?simulateConflict=1` that makes the server insert a "someone else booked this" entry and return `409`
- [ ] Start the worker in `main.ts` before `app.mount()` (await `worker.start()`)

## Step 4: API layer (20 min)
- [ ] `BookingsApi` interface (`list`, `create`, `update`, `remove`)
- [ ] `fetch` implementation in `api/httpBookingsApi.ts`
- [ ] Typed errors: `ConflictError`, `ValidationError`, `NotFoundError`, `NetworkError`
- [ ] Provide the API via `provide/inject` (or a single module export) so the UI depends only on the interface and a real backend is a one-file swap

## Step 5: Composables with Vue Query (25 min)
- [ ] Register `VueQueryPlugin` in `main.ts`
- [ ] `useBookings(date: Ref<string>)` with a reactive query key `['bookings', date]`
- [ ] `useCreateBooking`, `useUpdateBooking`, `useDeleteBooking`
- [ ] On success: invalidate `['bookings', date]`
- [ ] On `409`: invalidate the query (refresh the list) and keep the form open with the user's data

## Step 6: UI components (90 min)
- [ ] `DatePicker`: native `<input type="date">` is fine; past dates are viewable, create is disabled
- [ ] `BookingDayView`: timeline or slot list for 09:00–18:00 showing bookings; past slots greyed out for today
- [ ] `BookingForm` (inside a Reka UI `Dialog`): start, end, title, VeeValidate + zod schema built from the domain rules, inline errors
- [ ] Edit: open the same form prefilled; pass `editingId` to validation
- [ ] Delete: Reka UI `AlertDialog` confirmation
- [ ] UI states:
  - [ ] Loading (skeleton or spinner)
  - [ ] Empty ("No bookings for this day")
  - [ ] Error with a Retry button (`refetch`)
  - [ ] Submitting (button disabled, spinner; use `isPending` from the mutation)
- [ ] Conflict banner inside the form: "This slot was just taken. The list has been updated, please choose another time." Form values stay intact.
- [ ] Success toast after create, update and delete

## Step 7: Responsiveness and accessibility (30 min)
- [ ] Mobile layout (stacked day view, full-width dialog)
- [ ] Labels on all inputs; errors linked via `aria-describedby`
- [ ] `aria-live="polite"` region for errors and conflict messages
- [ ] Dialog focus trap, Esc to close, focus returns on close (Reka UI handles this)
- [ ] Visible focus styles and full keyboard navigation
- [ ] Sufficient color contrast; don't rely on color alone (e.g. "Past" or "Booked" labels)

## Step 8: Quality checks, deploy, README (30 min)
- [ ] `npm run type-check` (vue-tsc), `npm run lint`, `npm run test` all pass
- [ ] Optional: one component test for the conflict flow (form keeps data after a `409`)
- [ ] Deploy to Vercel or Netlify
- [ ] Ensure `public/mockServiceWorker.js` exists (`npx msw init public/`) and MSW is enabled in production
- [ ] README:
  - [ ] How to run (`npm install`, `npm run dev`, `npm test`)
  - [ ] What's done
  - [ ] What's not done and what you'd do next
  - [ ] Assumptions (answers or guesses from Step 0)
  - [ ] Architecture overview (domain / api / mocks / composables / components)
  - [ ] How to trigger the conflict demo
  - [ ] Time spent
- [ ] Export the AI chat transcripts (this chat and your Claude Code sessions)

---

## First prompt for Claude Code
> Read TASK.md and STEPS.md. Set up a Vue 3 + Vite + TypeScript project (Composition API, `<script setup>`, strict mode) with the folder structure from Step 1 and install the listed packages. Then do Step 2: implement the domain types and a pure `validateBooking` function covering all business rules, with Vitest tests for each rule and its edge cases. Don't build UI yet.
