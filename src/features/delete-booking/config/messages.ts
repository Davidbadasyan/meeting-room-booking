/** A 404 on delete is an outcome, not an error: someone else already removed the booking. */
export type DeleteOutcome = 'deleted' | 'alreadyDeleted'

export const deleteOutcomeMessages: Record<DeleteOutcome, string> = {
  deleted: 'Booking deleted.',
  alreadyDeleted: 'This booking had already been deleted. The list has been updated.',
}
