<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

defineProps<{ title: string }>()

const hasError = ref(false)

// Catches render and lifecycle errors from children. Returning false stops them reaching
// app.config.errorHandler, so the user sees this fallback instead of a toast as well.
onErrorCaptured((error) => {
  console.error('[error boundary]', error)
  hasError.value = true
  return false
})

function reloadPage() {
  window.location.reload()
}
</script>

<template>
  <div
    v-if="hasError"
    role="alert"
    class="border-destructive/40 flex flex-col items-center gap-3 rounded-xl border p-8 text-center"
  >
    <p class="text-destructive font-medium">{{ title }}</p>
    <p class="text-muted-foreground text-sm">Reloading the page usually fixes this.</p>
    <BaseButton variant="outline" @click="reloadPage">Reload page</BaseButton>
  </div>
  <slot v-else />
</template>
