<script setup lang="ts">
import { computed, nextTick, useId } from 'vue'
import { TITLE_MAX_LENGTH, type Booking } from '@/entities/booking'
import { savedMessages } from '@/features/booking-form/config/messages'
import { useBookingForm } from '@/features/booking-form/model/useBookingForm'
import { useTimeOptions } from '@/features/booking-form/model/useTimeOptions'
import { formatLongDate, type IsoDate, type Time } from '@/shared/lib/time'
import { BaseButton, BaseDialog, BaseInput, BaseSelect, toast } from '@/shared/ui'

const { date, booking, initialStart, returnFocus } = defineProps<{
  date: IsoDate
  /** The booking to edit; leave empty to create. */
  booking?: Booking
  /** Start time for a new booking, from a clicked free slot. */
  initialStart?: Time
  returnFocus?: () => HTMLElement | undefined
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const {
  start,
  end,
  title,
  errors,
  isEditing,
  isSubmitting,
  submitMessage,
  serverMessages,
  canCreateAsNew,
  submit,
  submitAsNew,
} = useBookingForm({
  date: () => date,
  booking: () => booking,
  initialStart: () => initialStart,
})
const { startOptions, endOptions } = useTimeOptions({ date: () => date, start, end })

const ids = {
  form: useId(),
  start: useId(),
  startError: useId(),
  end: useId(),
  endError: useId(),
  title: useId(),
  titleHint: useId(),
  titleError: useId(),
}

const dialogTitle = computed(() => {
  if (isEditing.value) return 'Edit booking'
  return 'New booking'
})
const submitLabel = computed(() => {
  if (isEditing.value) return 'Save changes'
  return 'Create booking'
})
const description = computed(() => formatLongDate(date))
const endPlaceholder = computed(() => {
  if (start.value === '') return 'Choose a start time first'
  return 'End time'
})

/** `aria-describedby` points at the error only while there is one. */
function errorIdWhenShown(error: string | undefined, errorId: string): string | undefined {
  if (error === undefined) return undefined
  return errorId
}

const startDescribedBy = computed(() => errorIdWhenShown(errors.value.start, ids.startError))
const endDescribedBy = computed(() => errorIdWhenShown(errors.value.end, ids.endError))
const titleDescribedBy = computed(() => {
  if (errors.value.title === undefined) return ids.titleHint
  return `${ids.titleHint} ${ids.titleError}`
})

function close() {
  isOpen.value = false
}

/** Fields in screen order, with the control a failed submit should move focus to. */
const focusableFields: { field: 'start' | 'end' | 'title'; id: string }[] = [
  { field: 'start', id: ids.start },
  { field: 'end', id: ids.end },
  { field: 'title', id: ids.title },
]

/**
 * After a failed submit, focus the first field with an error: a screen reader then reads
 * its label and the linked error, and keyboard users land where the fix is needed.
 * By id because the <select> sits inside the generated primitive, out of reach of a template ref.
 */
function focusFirstInvalidField() {
  const firstInvalid = focusableFields.find(({ field }) => errors.value[field] !== undefined)
  if (firstInvalid === undefined) return
  document.getElementById(firstInvalid.id)?.focus()
}

async function finish(saving: Promise<Booking | undefined>, message: string) {
  const saved = await saving
  if (saved === undefined) {
    await nextTick()
    focusFirstInvalidField()
    return
  }

  toast.success(message)
  close()
}

function onSubmit() {
  // The button is disabled while saving; this also stops a second Enter press.
  if (isSubmitting.value) return
  const message = isEditing.value ? savedMessages.updated : savedMessages.created
  finish(submit(), message)
}

function onCreateAsNew() {
  if (isSubmitting.value) return
  finish(submitAsNew(), savedMessages.created)
}
</script>

<template>
  <BaseDialog
    v-model:open="isOpen"
    :title="dialogTitle"
    :description="description"
    :return-focus="returnFocus"
  >
    <form :id="ids.form" class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <div
        v-if="submitMessage"
        role="alert"
        class="border-destructive/40 bg-destructive/10 flex flex-col gap-2 rounded-lg border p-3 text-sm"
      >
        <p>{{ submitMessage }}</p>
        <ul v-if="serverMessages.length > 0" class="list-disc pl-5">
          <li v-for="message in serverMessages" :key="message">{{ message }}</li>
        </ul>
        <BaseButton
          v-if="canCreateAsNew"
          variant="outline"
          size="sm"
          :is-loading="isSubmitting"
          @click="onCreateAsNew"
        >
          Create as new booking
        </BaseButton>
      </div>

      <p v-if="errors.date" role="alert" class="text-destructive text-sm">{{ errors.date }}</p>

      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label :for="ids.start" class="text-sm font-medium">Start</label>
          <BaseSelect
            :id="ids.start"
            v-model="start"
            :options="startOptions"
            placeholder="Start time"
            :aria-invalid="errors.start !== undefined"
            :aria-describedby="startDescribedBy"
          />
          <p v-if="errors.start" :id="ids.startError" class="text-destructive text-sm">
            {{ errors.start }}
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label :for="ids.end" class="text-sm font-medium">End</label>
          <BaseSelect
            :id="ids.end"
            v-model="end"
            :options="endOptions"
            :placeholder="endPlaceholder"
            :aria-invalid="errors.end !== undefined"
            :aria-describedby="endDescribedBy"
          />
          <p v-if="errors.end" :id="ids.endError" class="text-destructive text-sm">
            {{ errors.end }}
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label :for="ids.title" class="text-sm font-medium">Title</label>
        <BaseInput
          :id="ids.title"
          v-model="title"
          :maxlength="TITLE_MAX_LENGTH"
          autocomplete="off"
          :aria-invalid="errors.title !== undefined"
          :aria-describedby="titleDescribedBy"
        />
        <p :id="ids.titleHint" class="text-muted-foreground text-xs">
          Optional, up to {{ TITLE_MAX_LENGTH }} characters.
        </p>
        <p v-if="errors.title" :id="ids.titleError" class="text-destructive text-sm">
          {{ errors.title }}
        </p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="outline" :is-disabled="isSubmitting" @click="close">Cancel</BaseButton>
      <BaseButton type="submit" :form="ids.form" :is-loading="isSubmitting">
        {{ submitLabel }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>
