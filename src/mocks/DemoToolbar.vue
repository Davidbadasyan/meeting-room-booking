<script setup lang="ts">
import { resetDemoData } from '@/mocks/browser'
import { BaseButton } from '@/shared/ui'
</script>

<!-- Mock mode only; lives outside the app so deleting src/mocks removes it completely. -->
<template>
  <aside
    aria-label="Demo controls"
    class="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-3 px-4 pb-6 text-sm"
  >
    <span class="text-muted-foreground">Demo data is stored in this browser.</span>
    <BaseButton variant="outline" size="sm" @click="resetDemoData">Reset demo data</BaseButton>
  </aside>
</template>
