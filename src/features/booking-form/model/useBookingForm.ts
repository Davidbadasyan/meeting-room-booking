import { useForm } from 'vee-validate'
import { computed, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Booking } from '@/entities/booking'
import { useSaveBooking } from '@/features/booking-form/api/useSaveBooking'
import { toDraft, toFormValues, type BookingFormValues } from '@/features/booking-form/model/schema'
import { useRulesSchema } from '@/features/booking-form/model/useRulesSchema'
import { useSubmitProblem } from '@/features/booking-form/model/useSubmitProblem'
import type { IsoDate } from '@/shared/lib/time'

export interface UseBookingFormOptions {
  /** The day being booked. */
  date: MaybeRefOrGetter<IsoDate>
  /** The booking being edited; leave empty to create a new one. */
  booking?: MaybeRefOrGetter<Booking | undefined>
}

/**
 * Form state for creating or editing a booking. On any server error the user's input is kept:
 * - 409: the list is refreshed, then the form re-validates so the overlap shows on the field.
 * - 400: the server's details are shown on the matching fields.
 * - 404 (edit): the booking was deleted elsewhere; the list is refreshed.
 */
export function useBookingForm({ date, booking }: UseBookingFormOptions) {
  const editingId = computed(() => toValue(booking)?.id)
  const form = useForm<BookingFormValues>({
    validationSchema: useRulesSchema(date, editingId),
    initialValues: toFormValues(toValue(date), toValue(booking)),
  })
  const [start] = form.defineField('start')
  const [end] = form.defineField('end')
  const [title] = form.defineField('title')
  const { saveBooking } = useSaveBooking(editingId)
  const problem = useSubmitProblem(form)

  // Start over only when a different day or booking is opened, never on a list refresh.
  watch([() => toValue(date), editingId], () => {
    problem.clearSubmitProblem()
    form.resetForm({ values: toFormValues(toValue(date), toValue(booking)) })
  })

  async function save(values: BookingFormValues): Promise<Booking | undefined> {
    problem.clearSubmitProblem()
    try {
      return await saveBooking(toDraft(values))
    } catch (error) {
      await problem.reportSubmitError(error)
      return undefined
    }
  }

  return {
    start,
    end,
    title,
    errors: form.errors,
    isEditing: computed(() => editingId.value !== undefined),
    isSubmitting: form.isSubmitting,
    submitProblem: problem.submitProblem,
    submitMessage: problem.submitMessage,
    serverMessages: problem.serverMessages,
    /** Validates, then saves. Resolves with the saved booking, or undefined if it failed. */
    submit: form.handleSubmit(save),
  }
}
