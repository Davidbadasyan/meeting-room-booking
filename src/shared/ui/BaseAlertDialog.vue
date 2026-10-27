<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/primitives/alert-dialog'

const { returnFocus } = defineProps<{
  title: string
  description: string
  confirmLabel: string
  isPending: boolean
  /** Where focus goes on close, e.g. when the element that opened it is gone. */
  returnFocus?: () => HTMLElement | undefined
}>()

const emit = defineEmits<{ confirm: [] }>()

const isOpen = defineModel<boolean>('open', { required: true })

function onCloseAutoFocus(event: Event) {
  const target = returnFocus?.()
  if (target === undefined) return

  event.preventDefault()
  target.focus()
}
</script>

<!-- The confirm button is a plain button, so the dialog stays open while the request runs. -->
<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent @close-auto-focus="onCloseAutoFocus">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <slot />
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isPending">Cancel</AlertDialogCancel>
        <BaseButton variant="destructive" :is-loading="isPending" @click="emit('confirm')">
          {{ confirmLabel }}
        </BaseButton>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
