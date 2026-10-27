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

## Conflict demo

Open the app with `?simulateConflict=1`. The next create or edit makes the mock server insert a
"Booked by someone else" booking into the same slot first, so the request fails with `409`.
It fires once per page load; reload with the flag to repeat it.
