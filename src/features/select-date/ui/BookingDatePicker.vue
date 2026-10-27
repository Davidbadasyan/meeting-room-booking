<script setup lang="ts">
import { useId } from 'vue'
import type { IsoDate } from '@/shared/lib/time'
import { BaseButton, BaseInput } from '@/shared/ui'

defineProps<{
  date: IsoDate
  isPast: boolean
}>()

const emit = defineEmits<{
  select: [date: IsoDate]
  previous: []
  today: []
  next: []
}>()

const inputId = useId()

const FIRST_FOUR_DIGIT_YEAR = 1000

/**
 * The native date input sends '' when cleared, and partial years such as 0202-10-27 while a
 * year is typed digit by digit. Ignore both, so the page does not jump through those dates.
 */
function selectPickedDate(value: string) {
  if (value === '') return
  const isYearComplete = Number(value.slice(0, 4)) >= FIRST_FOUR_DIGIT_YEAR
  if (!isYearComplete) return
  emit('select', value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <label :for="inputId" class="text-sm font-medium">Date</label>
        <BaseInput
          :id="inputId"
          :model-value="date"
          type="date"
          class="w-auto"
          @update:model-value="selectPickedDate"
        />
      </div>
      <div role="group" aria-label="Change day" class="flex flex-wrap gap-2">
        <BaseButton variant="outline" @click="emit('previous')">Previous day</BaseButton>
        <BaseButton variant="outline" @click="emit('today')">Today</BaseButton>
        <BaseButton variant="outline" @click="emit('next')">Next day</BaseButton>
      </div>
    </div>
    <p v-if="isPast" role="status" class="text-muted-foreground text-sm">
      Past dates are view-only.
    </p>
  </div>
</template>
