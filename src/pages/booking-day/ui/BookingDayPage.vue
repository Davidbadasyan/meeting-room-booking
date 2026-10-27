<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'
import type { Booking } from '@/entities/booking'
import { BookingFormDialog, hasBookableStart } from '@/features/booking-form'
import { DeleteBookingDialog } from '@/features/delete-booking'
import { BookingDatePicker, useSelectedDate } from '@/features/select-date'
import { useNow } from '@/shared/lib/clock'
import { formatLongDate, type Time } from '@/shared/lib/time'
import { BaseButton, BaseErrorBoundary } from '@/shared/ui'
import { BookingTimeline } from '@/widgets/booking-timeline'

const APP_NAME = 'Meeting Room Booking'

const { selectedDate, isPast, selectDate, goToToday, goToPreviousDay, goToNextDay } =
  useSelectedDate()

const { now } = useNow()
// Past days, and today after the last start time (17:30), cannot take a new booking.
const canCreate = computed(() => hasBookableStart(selectedDate.value, now.value))
const heading = computed(() => formatLongDate(selectedDate.value))
const headingElement = useTemplateRef<HTMLElement>('heading')

// The tab title names the day, for screen-reader users and people with many tabs.
watch(
  heading,
  (day) => {
    document.title = `${day} · ${APP_NAME}`
  },
  { immediate: true },
)

const isFormOpen = ref(false)
// A new key per opening gives the form fresh state; the old one can finish its close animation.
const formKey = ref(0)
const editedBooking = shallowRef<Booking>()
const formStart = ref<Time>()

const isDeleteOpen = ref(false)
// Like formKey: a new key per opening, so an error from an earlier attempt never carries over.
const deleteKey = ref(0)
const bookingToDelete = shallowRef<Booking>()

let openedFrom: HTMLElement | undefined

function rememberWhatOpenedTheDialog() {
  openedFrom = document.querySelector<HTMLElement>(':focus') ?? undefined
}

/** Back to what opened the dialog; if that is gone (a slot became a booking), the heading. */
function returnFocus(): HTMLElement | undefined {
  if (openedFrom?.isConnected) return openedFrom
  return headingElement.value ?? undefined
}

function openForm(booking: Booking | undefined, start: Time | undefined) {
  rememberWhatOpenedTheDialog()
  editedBooking.value = booking
  formStart.value = start
  formKey.value += 1
  isFormOpen.value = true
}

function openCreate(start?: Time) {
  openForm(undefined, start)
}

function openEdit(booking: Booking) {
  openForm(booking, undefined)
}

function openDelete(booking: Booking) {
  rememberWhatOpenedTheDialog()
  bookingToDelete.value = booking
  deleteKey.value += 1
  isDeleteOpen.value = true
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
    <header class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-muted-foreground text-sm">Meeting room</p>
          <h1 ref="heading" tabindex="-1" class="text-2xl font-semibold outline-none">
            {{ heading }}
          </h1>
        </div>
        <BaseButton v-if="canCreate" @click="openCreate()">New booking</BaseButton>
      </div>
      <BookingDatePicker
        :date="selectedDate"
        :is-past="isPast"
        @select="selectDate"
        @previous="goToPreviousDay"
        @today="goToToday"
        @next="goToNextDay"
      />
    </header>

    <BaseErrorBoundary title="The schedule could not be shown.">
      <BookingTimeline
        :date="selectedDate"
        :can-create="canCreate"
        @create="openCreate"
        @edit="openEdit"
        @remove="openDelete"
      />
    </BaseErrorBoundary>

    <BookingFormDialog
      :key="formKey"
      v-model:open="isFormOpen"
      :date="selectedDate"
      :booking="editedBooking"
      :initial-start="formStart"
      :return-focus="returnFocus"
    />
    <DeleteBookingDialog
      v-if="bookingToDelete"
      :key="deleteKey"
      v-model:open="isDeleteOpen"
      :booking="bookingToDelete"
      :return-focus="returnFocus"
    />
  </main>
</template>
