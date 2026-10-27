<script setup lang="ts">
import { computed, useId } from 'vue'
import type { IsoDate } from '@/shared/lib/time'
import { BaseButton, BaseInput } from '@/shared/ui'

const props = defineProps<{
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

// The native date input sends '' when cleared; keep the current day instead.
const pickerValue = computed({
  get: () => props.date,
  set: (value: string) => {
    if (value === '') return
    emit('select', value)
  },
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <label :for="inputId" class="text-sm font-medium">Date</label>
        <BaseInput :id="inputId" v-model="pickerValue" type="date" class="w-auto" />
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
