<script setup lang="ts">
import { computed, useId } from 'vue'
import { useBookingsQuery, type Booking } from '@/entities/booking'
import type { IsoDate, Time } from '@/shared/lib/time'
import { BaseButton, BaseSkeleton, BaseSpinner, EmptyState, ErrorState } from '@/shared/ui'
import { SKELETON_ROWS } from '@/widgets/booking-timeline/config/timeline'
import type { TimelineSegment } from '@/widgets/booking-timeline/lib/buildTimeline'
import { useTimelineSlots } from '@/widgets/booking-timeline/model/useTimelineSlots'
import BookingTimelineBooking from '@/widgets/booking-timeline/ui/BookingTimelineBooking.vue'
import BookingTimelineSlot from '@/widgets/booking-timeline/ui/BookingTimelineSlot.vue'

const { date } = defineProps<{
  date: IsoDate
  canCreate: boolean
}>()

const emit = defineEmits<{
  create: [start?: Time]
  edit: [booking: Booking]
  remove: [booking: Booking]
}>()

const headingId = useId()
// No placeholder data: while a new date loads, the old date's bookings are not shown.
const { data, isPending, isError, isFetching, error, refetch } = useBookingsQuery(() => date)
const bookings = computed(() => data.value ?? [])
const { segments } = useTimelineSlots(() => date, bookings)

const isEmpty = computed(() => bookings.value.length === 0)
const hasSegments = computed(() => segments.value.length > 0)
const isUpdating = computed(() => isFetching.value && !isPending.value)
const errorMessage = computed(() => error.value?.message ?? '')

function segmentKey(segment: TimelineSegment): string {
  if (segment.kind === 'booking') return segment.booking.id
  return `free-${segment.start}`
}

function retry() {
  refetch()
}
</script>

<template>
  <section class="flex flex-col gap-3" :aria-labelledby="headingId">
    <div class="flex min-h-6 items-center justify-between gap-2">
      <h2 :id="headingId" class="text-lg font-semibold">Schedule</h2>
      <p
        v-if="isUpdating"
        role="status"
        class="text-muted-foreground flex items-center gap-1 text-sm"
      >
        <BaseSpinner />
        Updating…
      </p>
    </div>

    <div v-if="isPending" class="flex flex-col gap-2" aria-busy="true">
      <p role="status" class="sr-only">Loading bookings…</p>
      <BaseSkeleton v-for="row in SKELETON_ROWS" :key="row" class="h-12" />
    </div>

    <ErrorState
      v-else-if="isError"
      title="Could not load bookings"
      :message="errorMessage"
      :is-retrying="isFetching"
      @retry="retry"
    />

    <template v-else>
      <EmptyState v-if="isEmpty" title="No bookings for this day">
        <template #action>
          <BaseButton v-if="canCreate" @click="emit('create')">Book a slot</BaseButton>
        </template>
      </EmptyState>

      <!-- Free slots stay visible on an empty day, so any of them can be clicked to book. -->
      <ol v-if="hasSegments" class="flex flex-col gap-2">
        <template v-for="segment in segments" :key="segmentKey(segment)">
          <BookingTimelineBooking
            v-if="segment.kind === 'booking'"
            :segment="segment"
            @edit="emit('edit', $event)"
            @remove="emit('remove', $event)"
          />
          <BookingTimelineSlot v-else :segment="segment" @book="emit('create', $event)" />
        </template>
      </ol>
    </template>
  </section>
</template>
