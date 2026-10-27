<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/shared/ui/primitives/sonner'
</script>

<!-- Render once in the app. vue-sonner announces toasts through its own aria-live region. -->
<template>
  <Toaster position="top-center" :close-button="true" />
</template>
