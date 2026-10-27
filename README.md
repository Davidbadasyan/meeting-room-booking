# Meeting Room Booking

Vue 3 + Vite + TypeScript. See `STEPS.md` for the implementation plan.

## Run

```sh
npm install
npm run dev
npm test
```

## Assumptions (Step 0, pending answers)

- **Time step:** 15 minutes (`SLOT_STEP`). Validation does not enforce alignment to the step; the pickers do.
- **Timezone:** "today" and "now" are the user's local time.
- **Past bookings:** a booking that has already started or ended cannot be edited or deleted. Edits re-run the past-time rule on the new start.
- **Title:** optional in the UI as well as in the type.
- Starting in the current minute counts as not past (12:00 is bookable at 12:00:30).
- Bookings are half-open intervals, so 10:00–11:00 and 11:00–12:00 do not overlap.

## Demo switches

Add these to the page URL (they can be combined, e.g. `?slow=1&simulateConflict=1`):

| Flag | Effect |
|---|---|
| `?simulateConflict=1` | The next valid create or edit: the mock server first saves a "Booked by someone else" booking in that slot, so the request fails with `409`. |
| `?simulateError=1` | The next two list requests fail with `500` (the first try and the one automatic retry), so the error state shows and **Retry** then works. |
| `?slow=1` | Every response takes 2-4 s, so loading and submitting states are easy to see. |

Each switch fires once per page load; reload to repeat it.
