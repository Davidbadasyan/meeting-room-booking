<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'

defineProps<{
  title: string
  message: string
  isRetrying: boolean
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="border-destructive/40 flex flex-col items-center gap-3 rounded-xl border p-8 text-center"
  >
    <p class="text-destructive font-medium">{{ title }}</p>
    <p class="text-muted-foreground text-sm">{{ message }}</p>
    <BaseButton variant="outline" :is-loading="isRetrying" @click="emit('retry')">Retry</BaseButton>
  </div>
</template>
