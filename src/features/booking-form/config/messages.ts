/** Why the last submit failed, as shown above the form. */
export type SubmitProblem = 'conflict' | 'notFound' | 'invalid' | 'network' | 'failed'

export const submitProblemMessages: Record<SubmitProblem, string> = {
  conflict: 'This slot was just taken. The list has been updated, please choose another time.',
  notFound:
    'This booking no longer exists. It may have been deleted by someone else. The list has been updated.',
  invalid: 'The server rejected some fields. Please check them and try again.',
  network: 'Could not reach the server. Check your connection and try again.',
  failed: 'Something went wrong while saving. Please try again.',
}

export const fieldFormatMessages = {
  date: 'Choose a valid date',
  start: 'Choose a start time',
  end: 'Choose an end time',
}
