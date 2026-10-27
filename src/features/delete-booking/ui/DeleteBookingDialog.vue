<script setup lang="ts">
import { computed, ref } from 'vue'
import { displayTitle, formatTimeRange, type Booking } from '@/entities/booking'
import { useDeleteBooking } from '@/features/delete-booking/api/useDeleteBooking'
import { deleteOutcomeMessages } from '@/features/delete-booking/config/messages'
import { deleteErrorMessage } from '@/features/delete-booking/model/deleteErrorMessage'
import { formatLongDate } from '@/shared/lib/time'
import { BaseAlertDialog, toast } from '@/shared/ui'

const { booking } = defineProps<{
  booking: Booking
  returnFocus?: () => HTMLElement | undefined
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { mutateAsync: deleteBooking, isPending } = useDeleteBooking()
const errorMessage = ref<string>()

const description = computed(
  () =>
    `${formatLongDate(booking.date)}, ${formatTimeRange(booking)}: ${displayTitle(booking)}. This cannot be undone.`,
)

async function confirmDelete() {
  if (isPending.value) return
  errorMessage.value = undefined
  try {
    const outcome = await deleteBooking(booking.id)
    if (outcome === 'alreadyDeleted') toast.info(deleteOutcomeMessages.alreadyDeleted)
    if (outcome === 'deleted') toast.success(deleteOutcomeMessages.deleted)
    isOpen.value = false
  } catch (error) {
    errorMessage.value = deleteErrorMessage(error)
  }
}
</script>

<template>
  <BaseAlertDialog
    v-model:open="isOpen"
    title="Delete this booking?"
    :description="description"
    confirm-label="Delete"
    :is-pending="isPending"
    :return-focus="returnFocus"
    @confirm="confirmDelete"
  >
    <p v-if="errorMessage" role="alert" class="text-destructive text-sm">{{ errorMessage }}</p>
  </BaseAlertDialog>
</template>
