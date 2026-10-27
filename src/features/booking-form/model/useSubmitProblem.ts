import type { FormContext } from 'vee-validate'
import { computed, ref } from 'vue'
import { submitProblemMessages, type SubmitProblem } from '@/features/booking-form/config/messages'
import type { BookingFormValues } from '@/features/booking-form/model/schema'
import { splitServerErrors } from '@/features/booking-form/model/serverErrors'
import { ConflictError, NetworkError, NotFoundError, ValidationError } from '@/shared/api'

function problemFor(error: unknown): SubmitProblem {
  if (error instanceof ConflictError) return 'conflict'
  if (error instanceof ValidationError) return 'invalid'
  if (error instanceof NotFoundError) return 'notFound'
  if (error instanceof NetworkError) return 'network'
  return 'failed'
}

/** Turns a failed save into form state. Never touches the values, so the user's input is kept. */
export function useSubmitProblem(form: FormContext<BookingFormValues>) {
  const submitProblem = ref<SubmitProblem>()
  const serverMessages = ref<string[]>([])

  const submitMessage = computed(() => {
    if (submitProblem.value === undefined) return undefined
    return submitProblemMessages[submitProblem.value]
  })

  function clearSubmitProblem() {
    submitProblem.value = undefined
    serverMessages.value = []
  }

  function showServerErrors(error: ValidationError) {
    const { fieldErrors, otherMessages } = splitServerErrors(error.details)
    serverMessages.value = otherMessages
    form.setErrors(fieldErrors)
  }

  async function reportSubmitError(error: unknown) {
    submitProblem.value = problemFor(error)
    if (error instanceof ValidationError) showServerErrors(error)
    // The mutation already refreshed the list; re-validating marks the overlap on its field.
    if (error instanceof ConflictError) await form.validate()
  }

  return { submitProblem, submitMessage, serverMessages, clearSubmitProblem, reportSubmitError }
}
