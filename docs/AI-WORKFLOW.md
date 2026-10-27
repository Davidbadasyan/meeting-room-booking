# How I worked with AI on this assignment

I built this take-home with AI as a pair programmer: **Claude** (chat) for planning and review,
**Claude Code** (terminal) for implementation, tests and browser checks. I owned the
requirements, the standards, the decisions and the review; the AI did the typing and the
first drafts. This page summarises how, with links to the evidence.

- Commit history: https://github.com/Davidbadasyan/meeting-room-booking/commits/master
- Claude Code session, structured by phase: [transcript](https://gist.github.com/Davidbadasyan/54c476981ce3ee7660e7e5697400205f)
  ("Phase N" below refers to its sections)
- Live demo: https://meeting-room-booking-jade.vercel.app

## 1. Requirements before code

- Translated the brief into [TASK.md](TASK.md) and wrote an 8-step plan, [STEPS.md](STEPS.md),
  before any code: stack, folder layout, every business rule with its edge cases, and the UI states.
- Wrote down the open questions (time step, time zone, editing started bookings, optional title)
  and sent them to the team; the [README](../README.md#assumptions-pending-confirmation) lists the
  working assumptions until they are answered.
- Before building the data layer, had every rule in TASK.md checked against the implementation
  and the date code audited for UTC bugs (Phase 9). Result: no gaps in the rules; the tests were
  pinned to a non-UTC time zone so a UTC bug cannot pass unnoticed, and a second zone followed
  in Phase 10.

## 2. Standards I set, and how they are enforced

Each standard was written into [CONVENTIONS.md](CONVENTIONS.md), applied to the existing code
in its own commit, and enforced by tooling where possible.

| Standard | Applied in | Enforced by |
|---|---|---|
| Feature-Sliced Design (layers, public APIs, mocks outside the app) | [`ca41af0`](https://github.com/Davidbadasyan/meeting-room-booking/commit/ca41af0) · Phase 4 | Steiger (`npm run lint:arch`) |
| Simple, beginner-readable code: no casts, zod only at boundaries, rules as small named checks | [`dd4f14b`](https://github.com/Davidbadasyan/meeting-room-booking/commit/dd4f14b) · Phase 5 | oxlint, ESLint, review |
| `@/` imports only | [`f720bbe`](https://github.com/Davidbadasyan/meeting-room-booking/commit/f720bbe) · Phase 6 | ESLint `no-restricted-imports` |
| Vue 3.5 conventions: `defineModel`, props destructure, typed slots, no writable `computed`, no same-name shorthand | [`8eeb72e`](https://github.com/Davidbadasyan/meeting-room-booking/commit/8eeb72e) · Phase 11 | ESLint `vue/v-bind-style`, grep audit |
| Pinned toolchain: Node ≥ 22.22, `engine-strict`, clean `npm ci` | [`b06f9c3`](https://github.com/Davidbadasyan/meeting-room-booking/commit/b06f9c3) · Phase 13 | `.nvmrc`, `.npmrc` |
| Type-check, lint and tests before every commit | all steps | a check script used before each commit |

## 3. Where I steered the AI

The AI's first version was rarely the final one. Examples of decisions I made or changed:

| What I asked for | Why | Where |
|---|---|---|
| Vue instead of React: the first scaffold was deleted and the plan rewritten before continuing | A clean start instead of a half-migrated codebase | Phase 1 |
| One step per prompt, each ending with a report I review | Small, reviewable changes instead of one big drop | Phase 3 |
| 409 handling that refreshes the list, re-validates and keeps the user's input; 400 errors mapped onto form fields; explicit 404 for edit and delete | TASK.md rule 8, done properly rather than with a generic error | Phase 9 |
| A test at 01:30 local time and a `test:tz` script in two time zones | A `toISOString` bug only shows when the local and UTC dates differ | Phases 9–10 |
| `?simulateError` based on time, not on the retry count | The demo must not depend on client retry settings | Phase 10 |
| "Create as new booking" when the edited booking was deleted elsewhere | Never lose the user's input | Phase 10 |
| Close dialogs and show the toast immediately; refresh in the background (keep the awaited refresh only for 409) | Faster feedback without hiding conflicts | Phases 11, 14 |
| Mock store synced across browser tabs | Reviewers can produce a real 409 and 404 with two tabs, not only a simulated one | Phase 11 |
| Every binding written in full (`:return-focus="returnFocus"`), enforced by ESLint | Readability; I overruled the AI's use of the shorthand | Phase 11 |
| README claims about the process corrected to match the commit history | The write-up must be verifiable | Phase 14 |

## 4. Verification over trust

- **204 tests** (Vitest): business rules, time helpers in two time zones, the mock server, the
  HTTP client, composables against the real handlers, components and the full page.
- **Tests proven by breaking the code:** removing the re-validation after a 409, and making the
  form clear itself after an error, each made the corresponding test fail (Phases 9 and 10).
- **Accessibility:** axe-core on four page states with zero violations; the setup was first shown
  to catch planted problems (unlabelled input, image without alt text, empty button). Contrast was
  measured in the browser and fixed: 4.35 → 5.77, 3.31 → 4.58, focus ring 2.58 → 19.8 (Phases 10, 12).
- **Real browser checks** after each UI step: create, edit, delete, keyboard-only use, 320 px and
  375 px widths, every demo switch, the production build, and finally the live deploy.
- **Clean install on the pinned Node** caught a lockfile mismatch before deploy (Phase 13).

## 5. Mistakes caught along the way

Reviewing the AI's work mattered; these were caught and fixed before they reached `master`'s final state:

- A commit made while lint was failing: fixed, and from then on every commit ran behind a
  stop-on-failure check script (Phase 10).
- Same-name `v-bind` shorthands that broke the agreed style: caught in my review and then
  enforced with ESLint (Phase 11); an `as const` cast caught by the self-check (Phase 12).
- An over-long dialog on short screens, low-contrast labels and a weak focus ring: found in the
  browser, fixed and re-measured (Phases 10, 12).
- A lockfile written by a different npm version: caught by the clean-install check (Phase 13).

## 6. Boundaries

- Nothing was pushed or deployed without my explicit confirmation; I signed in to services myself.
- The deploy to Vercel was done by me, following the settings the AI documented.
- Assumptions are marked as pending until the team answers; they are not presented as facts.

## Time

About 1 h 45 min including planning (09:09–10:55), with AI assistance.
