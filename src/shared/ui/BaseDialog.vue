<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog'

defineProps<{
  title: string
  description: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })
</script>

<!-- Reka UI gives focus trap, Esc to close, and focus return to the element that opened it. -->
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <slot />
      <DialogFooter>
        <slot name="footer" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
