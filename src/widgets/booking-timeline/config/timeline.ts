/** Free time is offered in blocks of this many minutes (the shortest allowed booking). */
export const FREE_SLOT_MINUTES = 30

/** Desktop timeline: height per minute, so a 30-minute block is 3rem tall. */
export const REM_PER_MINUTE = 0.1

/** Placeholder rows while the day loads. */
export const SKELETON_ROWS = 6

export const bookingStatusLabels = {
  upcoming: '',
  inProgress: 'In progress',
  ended: 'Ended',
}

export const freeTimeLabels = {
  past: 'Past',
  bookable: 'Free',
  tooShort: 'Free, under 30 min',
}
