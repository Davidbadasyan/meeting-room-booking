<script setup lang="ts">
import { computed } from 'vue'
import BaseSpinner from '@/shared/ui/BaseSpinner.vue'
import { Button, type ButtonVariants } from '@/shared/ui/primitives/button'

const {
  variant = 'default',
  size = 'lg',
  type = 'button',
  isLoading = false,
  isDisabled = false,
} = defineProps<{
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  type?: 'button' | 'submit'
  /** Shows a spinner and blocks clicks, e.g. while a request is pending. */
  isLoading?: boolean
  isDisabled?: boolean
}>()

defineSlots<{ default(): unknown }>()

const isBlocked = computed(() => isLoading || isDisabled)
</script>

<template>
  <Button :variant="variant" :size="size" :type="type" :disabled="isBlocked" :aria-busy="isLoading">
    <BaseSpinner v-if="isLoading" />
    <slot />
  </Button>
</template>
