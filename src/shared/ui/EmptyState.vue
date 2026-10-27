<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
    <p class="font-medium">{{ title }}</p>
    <p v-if="description" class="text-muted-foreground text-sm">{{ description }}</p>
    <slot name="action" />
  </div>
</template>
