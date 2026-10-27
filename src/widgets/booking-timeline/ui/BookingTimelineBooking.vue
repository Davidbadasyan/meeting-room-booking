<script setup lang="ts">
import { computed } from 'vue'
import { BookingCard, describeBooking, type Booking } from '@/entities/booking'
import { BaseButton } from '@/shared/ui'
import { bookingStatusLabels } from '@/widgets/booking-timeline/config/timeline'
import type { BookingSegment } from '@/widgets/booking-timeline/lib/buildTimeline'
import { segmentStyle } from '@/widgets/booking-timeline/lib/segmentStyle'

const { segment } = defineProps<{ segment: BookingSegment }>()

const emit = defineEmits<{
  edit: [booking: Booking]
  remove: [booking: Booking]
}>()

// Started bookings cannot change; the status text says why the buttons are disabled.
const hasStarted = computed(() => segment.status !== 'upcoming')
const statusLabel = computed(() => bookingStatusLabels[segment.status])
const description = computed(() => describeBooking(segment.booking))
const style = computed(() => segmentStyle(segment.durationInMinutes))
</script>

<template>
  <li class="md:grid md:min-h-(--segment-height)" :style="style">
    <BookingCard :booking="segment.booking" :is-muted="hasStarted">
      <template #status>
        <p v-if="statusLabel" class="text-muted-foreground text-xs font-semibold uppercase">
          {{ statusLabel }}
        </p>
      </template>
      <template #actions>
        <BaseButton
          size="sm"
          variant="outline"
          :is-disabled="hasStarted"
          :aria-label="`Edit ${description}`"
          @click="emit('edit', segment.booking)"
        >
          Edit
        </BaseButton>
        <BaseButton
          size="sm"
          variant="destructive"
          :is-disabled="hasStarted"
          :aria-label="`Delete ${description}`"
          @click="emit('remove', segment.booking)"
        >
          Delete
        </BaseButton>
      </template>
    </BookingCard>
  </li>
</template>
