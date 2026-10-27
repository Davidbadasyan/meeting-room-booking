# Meeting Room Booking Interface

> English translation of the original assignment (provided in Russian).

## Task
Implement an interface for booking a meeting room during a working day.

**Working day: 09:00–18:00.**

The user must be able to:
- select a date;
- view existing bookings for the selected date;
- choose a start time and an end time;
- create a booking;
- edit a booking;
- delete a booking.

Display format is up to you: a list, a timeline, a slot grid, or a day calendar.

## Business Rules
1. Start and end times must be within the working day.
2. `start < end`.
3. Minimum duration: 30 minutes.
4. Maximum duration: 2 hours.
5. Bookings must not overlap.
   - Touching boundaries is not a conflict: 10:00–11:00 and 11:00–12:00 is allowed.
6. Booking time in the past is not allowed.
   - For today's date, past slots are unavailable.
   - For past dates, creating a booking is unavailable.
7. When editing, the current booking must not conflict with itself.
8. The server may return a conflict even if the UI considered the slot free.
   - This is expected behavior, not a bug.
   - The UI must handle it correctly: show a clear message, refresh the booking list, and not lose the data the user entered.

## What to Demonstrate
- Careful handling of business logic and validation.
- Correct UI states: loading, empty state, error, form submission.
- Handling of server errors, including conflicts.
- Separation of the API layer and the UI.
- Readable TypeScript and a clear code structure.
- Responsiveness and basic accessibility.

The design is not judged as artwork; engineering quality is what's evaluated.

## Stack
- React / Next.js / Vue.js.
- TypeScript is mandatory.
- Styling, state management, and forms are your choice.
- UI libraries and icons are allowed.

A real backend, authentication, database, and integrations are not needed.
If you need a server, implement a mock API (MSW, Route Handlers, an in-memory store, etc.).
The network layer must be separated from the UI and easy to replace with a real API.

### Suggested API Contract
```
GET    /api/bookings?date=YYYY-MM-DD
POST   /api/bookings
PATCH  /api/bookings/:id
DELETE /api/bookings/:id
```

```ts
type Booking = {
  id: string;
  date: string;  // YYYY-MM-DD
  start: string; // HH:mm
  end: string;   // HH:mm
  title?: string;
};
```

The server validates the business rules and can return a conflict (`409`).

## Timebox
Target: 4–6 hours.
If you run out of time, stop and describe in the README what you would finish and what your priorities were.

## Deliverables
- Link to the repository.
- README: how to run it, what's done, what's not done, how long it took.
- Link to a deployed demo (Vercel, Netlify, etc.).
- The chat transcript with the AI.

If something seems ambiguous, ask questions. That's better than silent guessing.
