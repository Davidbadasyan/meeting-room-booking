const MS_PER_SECOND = 1000

/** How often `useNow` refreshes. Past slots grey out at most this late. */
export const CLOCK_TICK_MS = 30 * MS_PER_SECOND

/** Queries retry once, and only for errors that may go away on their own. */
export const QUERY_RETRY_LIMIT = 1
