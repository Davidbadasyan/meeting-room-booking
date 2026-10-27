<script setup lang="ts">
import { computed } from 'vue'
import { displayTitle, formatTimeRange } from '@/entities/booking/lib/format'
import type { Booking } from '@/entities/booking/model/booking'

const { booking, isMuted = false } = defineProps<{
  booking: Booking
  /** Greyed out, e.g. for a booking that has started. Pair it with a text label. */
  isMuted?: boolean
}>()

const timeRange = computed(() => formatTimeRange(booking))
const title = computed(() => displayTitle(booking))
const isUntitled = computed(() => booking.title === undefined)
</script>

<template>
  <article
    class="bg-card flex h-full flex-wrap items-start justify-between gap-2 rounded-lg border p-3"
    :class="{ 'bg-muted': isMuted }"
  >
    <div class="flex min-w-0 flex-col gap-0.5">
      <p class="font-semibold tabular-nums">{{ timeRange }}</p>
      <p class="truncate" :class="{ 'text-muted-foreground italic': isUntitled }">{{ title }}</p>
      <slot name="status" />
    </div>
    <div class="flex gap-2">
      <slot name="actions" />
    </div>
  </article>
</template>
