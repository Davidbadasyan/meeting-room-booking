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

defineProps<{
  title: string
  description: string
  confirmLabel: string
  isPending: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const isOpen = defineModel<boolean>('open', { required: true })
</script>

<!-- The confirm button is a plain button, so the dialog stays open while the request runs. -->
<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent>
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
