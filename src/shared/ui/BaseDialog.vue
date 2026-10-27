<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog'

const { returnFocus } = defineProps<{
  title: string
  description: string
  /** Where focus goes on close. Reka's default is the element focused before opening. */
  returnFocus?: () => HTMLElement | undefined
}>()

const isOpen = defineModel<boolean>('open', { required: true })

defineSlots<{
  default(): unknown
  footer(): unknown
}>()

function onCloseAutoFocus(event: Event) {
  const target = returnFocus?.()
  if (target === undefined) return

  event.preventDefault()
  target.focus()
}
</script>

<!-- Reka UI gives focus trap, Esc to close, and focus return to the element that opened it. -->
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md" @close-auto-focus="onCloseAutoFocus">
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
