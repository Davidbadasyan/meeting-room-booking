<script setup lang="ts" generic="Value extends string">
import { NativeSelect, NativeSelectOption } from '@/shared/ui/primitives/native-select'
import type { SelectOption } from '@/shared/ui/selectOption'

defineProps<{
  options: SelectOption<Value>[]
  placeholder: string
}>()

/** '' while nothing is chosen, which shows the placeholder. */
const model = defineModel<Value | ''>({ required: true })
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
