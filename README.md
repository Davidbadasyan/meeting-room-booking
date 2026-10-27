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
| `?simulateError=1` | List requests fail with `500` for 5 s after the page loads, so the error state shows; **Retry** after that works. |
| `?slow=1` | Every response takes 2-4 s, so loading and submitting states are easy to see. |

Each switch fires once per page load; reload to repeat it.

### Real conflicts with two tabs

The mock server keeps its data in `localStorage` and reloads it when another tab changes it,
so two tabs behave like two users:

1. Open the same day in tab A and tab B.
2. **409:** in tab A open "New booking" for a free slot and fill it in. In tab B book the same slot.
   Back in tab A press **Create booking**: the conflict banner appears, the list refreshes, and the
   form keeps its values.
3. **404 on edit:** in tab A open **Edit** on a booking. In tab B delete it. Back in tab A press
   **Save changes**: the form says the booking no longer exists and offers **Create as new booking**.

**Reset demo data** (below the schedule, mock mode only) clears the saved bookings and reloads
with the seed data; other open tabs switch to the seed data too.
