<script setup lang="ts">
import { NativeSelect, NativeSelectOption } from '@/shared/ui/primitives/native-select'

export interface SelectOption {
  value: string
  label: string
  isDisabled?: boolean
}

defineProps<{
  options: SelectOption[]
  placeholder: string
}>()

const model = defineModel<string>({ required: true })
</script>

<!-- A native <select>: keyboard, screen readers and mobile pickers work out of the box. -->
<template>
  <NativeSelect v-model="model" class="w-full">
    <NativeSelectOption value="" disabled>{{ placeholder }}</NativeSelectOption>
    <NativeSelectOption
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.isDisabled"
    >
      {{ option.label }}
    </NativeSelectOption>
  </NativeSelect>
</template>
