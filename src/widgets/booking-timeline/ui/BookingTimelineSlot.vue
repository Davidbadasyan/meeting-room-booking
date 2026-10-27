<script setup lang="ts">
import { computed } from 'vue'
import type { Time } from '@/shared/lib/time'
import { freeTimeLabels } from '@/widgets/booking-timeline/config/timeline'
import type { FreeSegment } from '@/widgets/booking-timeline/lib/buildTimeline'
import { segmentStyle } from '@/widgets/booking-timeline/lib/segmentStyle'

const { segment } = defineProps<{ segment: FreeSegment }>()

const emit = defineEmits<{ book: [start: Time] }>()

const isBookable = computed(() => segment.state === 'bookable')
const label = computed(() => freeTimeLabels[segment.state])
const style = computed(() => segmentStyle(segment.durationInMinutes))
</script>

<template>
  <li class="md:min-h-(--segment-height)" :style="style">
    <button
      v-if="isBookable"
      type="button"
      class="hover:bg-accent focus-visible:ring-ring/50 flex h-full w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-left outline-none focus-visible:ring-3"
      :aria-label="`Book from ${segment.start}`"
      @click="emit('book', segment.start)"
    >
      <span class="tabular-nums">{{ segment.start }}</span>
      <span class="text-muted-foreground text-sm">{{ label }}</span>
    </button>
    <div
      v-else
      class="bg-muted text-muted-foreground flex h-full items-center gap-3 rounded-lg px-3 py-2 text-sm"
    >
      <span class="tabular-nums">{{ segment.start }}–{{ segment.end }}</span>
      <span class="font-medium">{{ label }}</span>
    </div>
  </li>
</template>
